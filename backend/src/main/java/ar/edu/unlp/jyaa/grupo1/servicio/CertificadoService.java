package ar.edu.unlp.jyaa.grupo1.servicio;

import ar.edu.unlp.jyaa.grupo1.config.JpaUtil;
import ar.edu.unlp.jyaa.grupo1.dao.ActividadDAO;
import ar.edu.unlp.jyaa.grupo1.dao.CertificadoDAO;
import ar.edu.unlp.jyaa.grupo1.dao.CronogramaPersonalDAO;
import ar.edu.unlp.jyaa.grupo1.dao.InscripcionCongresoDAO;
import ar.edu.unlp.jyaa.grupo1.dao.UsuarioDAO;
import ar.edu.unlp.jyaa.grupo1.dao.filtro.InscripcionFiltro;
import ar.edu.unlp.jyaa.grupo1.modelo.Actividad;
import ar.edu.unlp.jyaa.grupo1.modelo.Certificado;
import ar.edu.unlp.jyaa.grupo1.modelo.Congreso;
import ar.edu.unlp.jyaa.grupo1.modelo.CronogramaPersonal;
import ar.edu.unlp.jyaa.grupo1.modelo.EstadoInscripcion;
import ar.edu.unlp.jyaa.grupo1.modelo.InscripcionCongreso;
import ar.edu.unlp.jyaa.grupo1.modelo.Rol;
import ar.edu.unlp.jyaa.grupo1.modelo.Trabajo;
import ar.edu.unlp.jyaa.grupo1.modelo.Usuario;
import ar.edu.unlp.jyaa.grupo1.web.dto.CertificadoItemDTO;
import ar.edu.unlp.jyaa.grupo1.web.dto.FinalizarCertificadosResultadoDTO;
import ar.edu.unlp.jyaa.grupo1.web.dto.MisCertificadosDTO;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Emisión masiva y listado del hub de certificados. No genera PDF en servidor: registra la emisión
 * y habilita la pantalla imprimible del frontend ({@code /mis-certificados}).
 */
@RequestScoped
public class CertificadoService {

  private static final Logger log = LoggerFactory.getLogger(CertificadoService.class);

  private static final String PLANTILLA = "CERTIFICADOS_DISPONIBLES";
  /** Hub unificado de certificados (fase 1). */
  public static final String URL_MIS_CERTIFICADOS = "/mis-certificados";

  @Inject private CertificadoDAO certificadoDAO;
  @Inject private InscripcionCongresoDAO inscripcionDAO;
  @Inject private UsuarioDAO usuarioDAO;
  @Inject private ActividadDAO actividadDAO;
  @Inject private CronogramaPersonalDAO cronogramaPersonalDAO;
  @Inject private NotificacionService notificacionService;

  /**
   * Certificados que corresponden al usuario: asistencia, evaluador, presentación (trabajo en
   * actividad) y participación por agenda personal.
   */
  public MisCertificadosDTO listarMios(Long usuarioId) {
    Usuario usuario = usuarioDAO.recuperarPorId(usuarioId);
    if (usuario == null) {
      throw new NegocioException("Usuario no encontrado: " + usuarioId);
    }

    LocalDate disponiblesDesde =
        JpaUtil.ejecutarEnTransaccionReturning(
            em -> {
              try {
                return resolverCongresoPrincipal(em).getCertificadosDisponiblesDesde();
              } catch (NegocioException e) {
                return null;
              }
            });

    LocalDate hoy = LocalDate.now();
    boolean habilitados =
        disponiblesDesde != null && !hoy.isBefore(disponiblesDesde);

    String tituloCongreso = tituloCongresoCorto();
    List<CertificadoItemDTO> items = new ArrayList<>();

    if (correspondeAsistencia(usuario)) {
      String rolLabel = etiquetaAsistencia(usuario);
      items.add(
          new CertificadoItemDTO(
              "ASISTENCIA",
              "Certificado de asistencia",
              "Certifica su participación como "
                  + rolLabel
                  + " en el "
                  + tituloCongreso
                  + ".",
              List.of()));
    }

    if (usuario.getRoles() != null && usuario.getRoles().contains(Rol.EVALUADOR)) {
      items.add(
          new CertificadoItemDTO(
              "EVALUADOR",
              "Certificado de evaluador/a",
              "Certifica su participación como evaluador/a en el " + tituloCongreso + ".",
              List.of()));
    }

    List<String> presentaciones = lineasPresentaciones(usuarioId);
    if (!presentaciones.isEmpty()) {
      items.add(
          new CertificadoItemDTO(
              "PRESENTACION",
              "Certificado de presentación de trabajo",
              "Certifica la presentación de trabajo(s) en actividad(es) del " + tituloCongreso + ".",
              presentaciones));
    }

    List<String> agendadas = lineasAgenda(usuarioId);
    if (!agendadas.isEmpty()) {
      items.add(
          new CertificadoItemDTO(
              "PARTICIPACION_ACTIVIDADES",
              "Certificado de participación en actividades",
              "Certifica su inscripción en la agenda personal a las siguientes actividades del "
                  + tituloCongreso
                  + ".",
              agendadas));
    }

    return new MisCertificadosDTO(habilitados, disponiblesDesde, items);
  }

  /**
   * Si ya pasó el último día del congreso ({@code hoy > congresoHasta}) y aún no se notificó la
   * emisión, ejecuta el mismo pipeline que el botón admin.
   */
  public FinalizarCertificadosResultadoDTO intentarAutoFinalizarSiCorresponde() {
    AutoCheck check =
        JpaUtil.ejecutarEnTransaccionReturning(
            em -> {
              Congreso c = resolverCongresoPrincipal(em);
              LocalDate hasta = c.getCongresoHasta();
              LocalDate hoy = LocalDate.now();
              boolean vencido = hasta != null && hoy.isAfter(hasta);
              boolean pendiente = !c.isCertificadosEmisionNotificada();
              return new AutoCheck(vencido && pendiente, hasta);
            });
    if (!check.debeCorrer()) {
      return null;
    }
    log.info(
        "Auto-habilitación de certificados: pasó el día de congresoHasta ({})",
        check.congresoHasta());
    return finalizarYHabilitar();
  }

  /**
   * Setea {@code certificadosDisponiblesDesde = hoy} (si no había fecha o era futura), crea
   * registros {@link Certificado} para elegibles (inscritos, evaluadores, autores con trabajo
   * programado, usuarios con agenda) y notifica.
   */
  public FinalizarCertificadosResultadoDTO finalizarYHabilitar() {
    LocalDate hoy = LocalDate.now();

    boolean[] yaNotificado = {false};
    LocalDate desdeHabilitados =
        JpaUtil.ejecutarEnTransaccionReturning(
            em -> {
              Congreso congreso = resolverCongresoPrincipal(em);
              yaNotificado[0] = congreso.isCertificadosEmisionNotificada();
              LocalDate actual = congreso.getCertificadosDisponiblesDesde();
              if (actual == null || actual.isAfter(hoy)) {
                congreso.setCertificadosDisponiblesDesde(hoy);
              }
              em.flush();
              return congreso.getCertificadosDisponiblesDesde();
            });

    Set<Long> elegibles = recolectarElegibles();

    int creados = 0;
    int yaExistentes = 0;
    Set<Long> nuevosRegistros = new HashSet<>();
    for (Long usuarioId : elegibles) {
      Usuario u = usuarioDAO.recuperarPorId(usuarioId);
      if (u == null) {
        continue;
      }
      if (emitirSiFalta(u, hoy)) {
        creados++;
        nuevosRegistros.add(usuarioId);
      } else {
        yaExistentes++;
      }
    }

    Set<Long> aNotificar = !yaNotificado[0] ? elegibles : nuevosRegistros;

    int notificadas = 0;
    for (Long usuarioId : aNotificar) {
      Usuario u = usuarioDAO.recuperarPorId(usuarioId);
      if (u == null) {
        continue;
      }
      Map<String, String> vars = new HashMap<>();
      vars.put("fecha", desdeHabilitados != null ? desdeHabilitados.toString() : hoy.toString());
      vars.put("enlace", URL_MIS_CERTIFICADOS);
      vars.put(
          "proximo_paso",
          "Entrá a Mis certificados, revisá los que te correspondan e imprimí o guardá el PDF.");
      vars.put("rol_texto", textoRolParaMensaje(u));
      notificacionService.enviarConPlantilla(usuarioId, PLANTILLA, vars);
      notificadas++;
    }

    JpaUtil.ejecutarEnTransaccion(
        em -> {
          Congreso congreso = resolverCongresoPrincipal(em);
          congreso.setCertificadosEmisionNotificada(true);
          em.flush();
        });

    return new FinalizarCertificadosResultadoDTO(
        desdeHabilitados, creados, yaExistentes, notificadas);
  }

  private Set<Long> recolectarElegibles() {
    Set<Long> elegibles = new HashSet<>();

    List<InscripcionCongreso> aprobadas =
        inscripcionDAO.listarFiltrado(
            new InscripcionFiltro(EstadoInscripcion.APROBADA, null, null), 0, 10_000);
    for (InscripcionCongreso ins : aprobadas) {
      Usuario u = ins.getUsuario();
      if (u != null && u.getId() != null) {
        elegibles.add(u.getId());
      }
    }

    for (Usuario u : usuarioDAO.listarPaginado(0, 2_000)) {
      if (u.getId() == null || u.getRoles() == null) {
        continue;
      }
      if (u.getRoles().contains(Rol.EVALUADOR)
          || u.getRoles().contains(Rol.AUTOR)
          || u.getRoles().contains(Rol.ASISTENTE)) {
        elegibles.add(u.getId());
      }
    }

    for (Actividad a : actividadDAO.listarCronogramaCompleto()) {
      if (a.getTrabajos() == null) {
        continue;
      }
      for (Trabajo t : a.getTrabajos()) {
        if (t.getAutor() != null && t.getAutor().getId() != null) {
          elegibles.add(t.getAutor().getId());
        }
      }
    }

    for (CronogramaPersonal cron : cronogramaPersonalDAO.listarTodos()) {
      if (cron.getActividades() == null || cron.getActividades().isEmpty()) {
        continue;
      }
      Usuario u = cron.getUsuario();
      if (u != null && u.getId() != null) {
        elegibles.add(u.getId());
      }
    }

    return elegibles;
  }

  private static String etiquetaAsistencia(Usuario usuario) {
    boolean autor = usuario.getRoles() != null && usuario.getRoles().contains(Rol.AUTOR);
    boolean asistente = usuario.getRoles() != null && usuario.getRoles().contains(Rol.ASISTENTE);
    if (autor && asistente) {
      return "asistente y autor/a";
    }
    if (autor) {
      return "autor/a";
    }
    if (asistente) {
      return "asistente";
    }
    return "participante";
  }

  private boolean correspondeAsistencia(Usuario usuario) {
    if (usuario.getRoles() != null
        && (usuario.getRoles().contains(Rol.ASISTENTE)
            || usuario.getRoles().contains(Rol.AUTOR))) {
      return true;
    }
    for (InscripcionCongreso ins : inscripcionDAO.listarPorUsuario(usuario.getId())) {
      if (ins.getEstado() == EstadoInscripcion.APROBADA) {
        return true;
      }
    }
    return false;
  }

  private List<String> lineasPresentaciones(Long usuarioId) {
    List<String> lineas = new ArrayList<>();
    for (Actividad a : actividadDAO.listarCronogramaCompleto()) {
      List<Trabajo> trabajos = a.getTrabajos();
      if (trabajos == null) {
        continue;
      }
      for (Trabajo t : trabajos) {
        if (t.getAutor() == null || !usuarioId.equals(t.getAutor().getId())) {
          continue;
        }
        String trabajo = t.getTitulo() != null ? t.getTitulo().trim() : "Trabajo";
        String act = a.getTitulo() != null ? a.getTitulo().trim() : "Actividad";
        lineas.add(trabajo + " — " + act);
      }
    }
    lineas.sort(String.CASE_INSENSITIVE_ORDER);
    return lineas;
  }

  private List<String> lineasAgenda(Long usuarioId) {
    Optional<CronogramaPersonal> opt = cronogramaPersonalDAO.buscarPorUsuarioId(usuarioId);
    if (opt.isEmpty() || opt.get().getActividades() == null) {
      return List.of();
    }
    List<Actividad> acts = new ArrayList<>(opt.get().getActividades());
    acts.sort(
        Comparator.comparing(Actividad::getInicio, Comparator.nullsLast(Comparator.naturalOrder()))
            .thenComparing(
                Actividad::getTitulo, Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER)));
    List<String> lineas = new ArrayList<>();
    for (Actividad a : acts) {
      if (a.getTitulo() == null || a.getTitulo().isBlank()) {
        continue;
      }
      lineas.add(a.getTitulo().trim());
    }
    return lineas;
  }

  private String tituloCongresoCorto() {
    return JpaUtil.ejecutarEnTransaccionReturning(
        em -> {
          try {
            Congreso c = resolverCongresoPrincipal(em);
            String ed = c.getEdicion() != null && !c.getEdicion().isBlank() ? c.getEdicion().trim() : "V";
            String nom =
                c.getNombre() != null && !c.getNombre().isBlank()
                    ? c.getNombre().trim()
                    : "Congreso Argentino de Agroecología";
            return ed + " " + nom;
          } catch (NegocioException e) {
            return "V Congreso Argentino de Agroecología";
          }
        });
  }

  private static String textoRolParaMensaje(Usuario u) {
    if (u.getRoles() == null || u.getRoles().isEmpty()) {
      return "participante";
    }
    if (u.getRoles().contains(Rol.EVALUADOR)
        && (u.getRoles().contains(Rol.ASISTENTE) || u.getRoles().contains(Rol.AUTOR))) {
      return "asistente/autor y evaluador/a";
    }
    if (u.getRoles().contains(Rol.EVALUADOR)) {
      return "evaluador/a";
    }
    if (u.getRoles().contains(Rol.AUTOR)) {
      return "autor/a";
    }
    return "asistente";
  }

  private boolean emitirSiFalta(Usuario usuario, LocalDate fecha) {
    if (certificadoDAO.existePorUsuarioId(usuario.getId())) {
      return false;
    }
    Certificado c = new Certificado();
    c.setUsuario(usuario);
    c.setFechaEmision(fecha);
    c.setArchivoUrl(URL_MIS_CERTIFICADOS);
    certificadoDAO.alta(c);
    return true;
  }

  private static Congreso resolverCongresoPrincipal(EntityManager em) {
    List<Congreso> list =
        em.createQuery("SELECT c FROM Congreso c ORDER BY c.id DESC", Congreso.class)
            .setMaxResults(1)
            .getResultList();
    if (!list.isEmpty()) {
      return list.getFirst();
    }
    throw new NegocioException("No hay congreso configurado");
  }

  private record AutoCheck(boolean debeCorrer, LocalDate congresoHasta) {}
}
