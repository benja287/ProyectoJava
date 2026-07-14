package ar.edu.unlp.jyaa.grupo1.servicio;

import ar.edu.unlp.jyaa.grupo1.config.JpaUtil;
import ar.edu.unlp.jyaa.grupo1.dao.CertificadoDAO;
import ar.edu.unlp.jyaa.grupo1.dao.InscripcionCongresoDAO;
import ar.edu.unlp.jyaa.grupo1.dao.UsuarioDAO;
import ar.edu.unlp.jyaa.grupo1.dao.filtro.InscripcionFiltro;
import ar.edu.unlp.jyaa.grupo1.modelo.Certificado;
import ar.edu.unlp.jyaa.grupo1.modelo.Congreso;
import ar.edu.unlp.jyaa.grupo1.modelo.EstadoInscripcion;
import ar.edu.unlp.jyaa.grupo1.modelo.InscripcionCongreso;
import ar.edu.unlp.jyaa.grupo1.modelo.Rol;
import ar.edu.unlp.jyaa.grupo1.modelo.Usuario;
import ar.edu.unlp.jyaa.grupo1.web.dto.FinalizarCertificadosResultadoDTO;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Emisión masiva de certificados al finalizar el congreso. No genera PDF en servidor: registra la
 * emisión y habilita la pantalla imprimible del frontend.
 */
@RequestScoped
public class CertificadoService {

  private static final String PLANTILLA = "CERTIFICADOS_DISPONIBLES";
  private static final String URL_CERTIFICADO_ASISTENTE = "/asistente/certificado";
  private static final String URL_CERTIFICADO_EVALUADOR = "/evaluador/certificado";

  @Inject private CertificadoDAO certificadoDAO;
  @Inject private InscripcionCongresoDAO inscripcionDAO;
  @Inject private UsuarioDAO usuarioDAO;
  @Inject private NotificacionService notificacionService;

  /**
   * Setea {@code certificadosDisponiblesDesde = hoy} (si no había fecha), crea registros {@link
   * Certificado} para inscritos APROBADOS y evaluadores, y notifica.
   */
  public FinalizarCertificadosResultadoDTO finalizarYHabilitar() {
    LocalDate hoy = LocalDate.now();

    LocalDate desdeHabilitados =
        JpaUtil.ejecutarEnTransaccionReturning(
            em -> {
              Congreso congreso = resolverCongresoPrincipal(em);
              LocalDate actual = congreso.getCertificadosDisponiblesDesde();
              // Sin fecha o fecha futura: habilitar desde hoy al finalizar.
              if (actual == null || actual.isAfter(hoy)) {
                congreso.setCertificadosDisponiblesDesde(hoy);
              }
              em.flush();
              return congreso.getCertificadosDisponiblesDesde();
            });

    Set<Long> elegibles = new HashSet<>();
    int creados = 0;
    int yaExistentes = 0;

    List<InscripcionCongreso> aprobadas =
        inscripcionDAO.listarFiltrado(
            new InscripcionFiltro(EstadoInscripcion.APROBADA, null, null), 0, 10_000);
    for (InscripcionCongreso ins : aprobadas) {
      Usuario u = ins.getUsuario();
      if (u == null || u.getId() == null || !elegibles.add(u.getId())) {
        continue;
      }
      if (emitirSiFalta(u, hoy, URL_CERTIFICADO_ASISTENTE)) {
        creados++;
      } else {
        yaExistentes++;
      }
    }

    for (Usuario u : usuarioDAO.listarPaginado(0, 2_000)) {
      if (u.getId() == null || !u.getRoles().contains(Rol.EVALUADOR)) {
        continue;
      }
      if (!elegibles.add(u.getId())) {
        continue;
      }
      if (emitirSiFalta(u, hoy, URL_CERTIFICADO_EVALUADOR)) {
        creados++;
      } else {
        yaExistentes++;
      }
    }

    int notificadas = 0;
    for (Long usuarioId : elegibles) {
      Usuario u = usuarioDAO.recuperarPorId(usuarioId);
      if (u == null) {
        continue;
      }
      Map<String, String> vars = new HashMap<>();
      vars.put("fecha", desdeHabilitados != null ? desdeHabilitados.toString() : hoy.toString());
      boolean soloEvaluador =
          u.getRoles().contains(Rol.EVALUADOR)
              && !u.getRoles().contains(Rol.ASISTENTE)
              && !u.getRoles().contains(Rol.AUTOR);
      vars.put(
          "enlace", soloEvaluador ? URL_CERTIFICADO_EVALUADOR : URL_CERTIFICADO_ASISTENTE);
      notificacionService.enviarConPlantilla(usuarioId, PLANTILLA, vars);
      notificadas++;
    }

    return new FinalizarCertificadosResultadoDTO(
        desdeHabilitados, creados, yaExistentes, notificadas);
  }

  private boolean emitirSiFalta(Usuario usuario, LocalDate fecha, String archivoUrl) {
    if (certificadoDAO.existePorUsuarioId(usuario.getId())) {
      return false;
    }
    Certificado c = new Certificado();
    c.setUsuario(usuario);
    c.setFechaEmision(fecha);
    c.setArchivoUrl(archivoUrl);
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
}
