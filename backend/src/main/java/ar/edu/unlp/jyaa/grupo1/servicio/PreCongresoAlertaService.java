package ar.edu.unlp.jyaa.grupo1.servicio;

import ar.edu.unlp.jyaa.grupo1.dao.AsignacionEvaluacionDAO;
import ar.edu.unlp.jyaa.grupo1.dao.InscripcionCongresoDAO;
import ar.edu.unlp.jyaa.grupo1.dao.TrabajoDAO;
import ar.edu.unlp.jyaa.grupo1.dao.filtro.InscripcionFiltro;
import ar.edu.unlp.jyaa.grupo1.dao.filtro.TrabajoFiltro;
import ar.edu.unlp.jyaa.grupo1.modelo.AsignacionEvaluacion;
import ar.edu.unlp.jyaa.grupo1.modelo.EstadoInscripcion;
import ar.edu.unlp.jyaa.grupo1.modelo.EstadoTrabajo;
import ar.edu.unlp.jyaa.grupo1.modelo.Rol;
import ar.edu.unlp.jyaa.grupo1.modelo.Trabajo;
import ar.edu.unlp.jyaa.grupo1.modelo.Usuario;
import ar.edu.unlp.jyaa.grupo1.web.dto.AlertaEnvioResultadoDTO;
import ar.edu.unlp.jyaa.grupo1.web.dto.PreCongresoReadinessDTO;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Alertas pre-congreso (organización) y recordatorios a usuarios con tareas pendientes.
 *
 * <p>Sin cron de sistema: el admin/comité dispara el envío desde el panel (equivalente a un job
 * manual).
 */
@RequestScoped
public class PreCongresoAlertaService {

  private static final String PLANTILLA_ORG = "PRECONGRESO_ORGANIZACION";
  private static final String PLANTILLA_PENDIENTE = "RECORDATORIO_PENDIENTE";

  @Inject private CongresoService congresoService;
  @Inject private TrabajoDAO trabajoDAO;
  @Inject private AsignacionEvaluacionDAO asignacionEvaluacionDAO;
  @Inject private InscripcionCongresoDAO inscripcionDAO;
  @Inject private NotificacionService notificacionService;

  public PreCongresoReadinessDTO obtenerReadiness() {
    boolean programaPublicado = congresoService.isProgramaPublicado();

    long precheck =
        trabajoDAO.contarFiltrado(
            new TrabajoFiltro(null, null, null, EstadoTrabajo.ENVIADO, null, null, null));
    long aprobComite =
        trabajoDAO.contarFiltrado(
            new TrabajoFiltro(
                null, null, null, EstadoTrabajo.PENDIENTE_APROBACION_COMITE, null, null, null));
    long enEval =
        trabajoDAO.contarFiltrado(
            new TrabajoFiltro(null, null, null, EstadoTrabajo.EN_EVALUACION, null, null, null));

    List<AsignacionEvaluacion> asignaciones = asignacionEvaluacionDAO.listarTodos();
    long invitaciones =
        asignaciones.stream().filter(a -> a.getFechaRespuesta() == null).count();
    long dictamenes =
        asignaciones.stream()
            .filter(a -> a.isAceptada() && a.getFechaRespuesta() != null && a.getEvaluacion() == null)
            .count();

    long inscPend =
        inscripcionDAO.contarFiltrado(
            new InscripcionFiltro(EstadoInscripcion.PENDIENTE, null, null));

    List<String> alertas = new ArrayList<>();
    if (!programaPublicado) {
      alertas.add("El programa del congreso aún no está publicado.");
    }
    if (precheck > 0) {
      alertas.add(precheck + " trabajo(s) esperando precheck del comité.");
    }
    if (aprobComite > 0) {
      alertas.add(aprobComite + " trabajo(s) pendientes de aprobación final del comité.");
    }
    if (dictamenes > 0) {
      alertas.add(dictamenes + " dictamen(es) de evaluación pendientes.");
    }
    if (invitaciones > 0) {
      alertas.add(invitaciones + " invitación(es) de evaluación sin respuesta.");
    }
    if (enEval > 0) {
      alertas.add(enEval + " trabajo(s) en evaluación.");
    }
    if (inscPend > 0) {
      alertas.add(inscPend + " inscripción(es) pendientes de revisión.");
    }

    boolean listo = alertas.isEmpty();
    return new PreCongresoReadinessDTO(
        listo,
        programaPublicado,
        precheck,
        aprobComite,
        enEval,
        dictamenes,
        invitaciones,
        inscPend,
        List.copyOf(alertas));
  }

  /** Avisa a ADMIN + COMITÉ con el checklist. */
  public AlertaEnvioResultadoDTO notificarOrganizacion() {
    PreCongresoReadinessDTO r = obtenerReadiness();
    String resumen =
        r.listo()
            ? "Todo listo antes de empezar: no hay pendientes críticos detectados."
            : "Pendientes:\n• " + String.join("\n• ", r.alertas());
    Map<String, String> vars = new HashMap<>();
    vars.put("resumen", resumen);
    vars.put("estado", r.listo() ? "LISTO" : "CON PENDIENTES");
    vars.put("enlace", "/admin/estadisticas");
    vars.put(
        "proximo_paso",
        r.listo()
            ? "Revisá el panel por si hay novedades."
            : "Ingresá a la plataforma y resolvé los pendientes del checklist.");

    int n = 0;
    n +=
        notificacionService.enviarPorRolConPlantilla(
            Rol.ADMINISTRADOR, PLANTILLA_ORG, vars, null);
    Map<String, String> varsComite = new HashMap<>(vars);
    varsComite.put("enlace", "/organizador/estadisticas");
    n +=
        notificacionService.enviarPorRolConPlantilla(
            Rol.ORGANIZADOR_CIENTIFICO, PLANTILLA_ORG, varsComite, null);

    return new AlertaEnvioResultadoDTO(
        n,
        0,
        r.listo()
            ? "Se avisó a organización: checklist OK."
            : "Se avisó a organización con " + r.alertas().size() + " alerta(s).");
  }

  /**
   * Recordatorio a quien tiene tarea pendiente (evaluadores e invitaciones, autores observados).
   * Sin tracking de login: se avisa a quien aún debe actuar (equivale a “se colgaron”).
   */
  public AlertaEnvioResultadoDTO notificarPendientesUsuarios() {
    Set<Long> yaAvisados = new HashSet<>();
    int enviados = 0;

    for (AsignacionEvaluacion a : asignacionEvaluacionDAO.listarTodos()) {
      Usuario ev = a.getEvaluador();
      if (ev == null || ev.getId() == null || !yaAvisados.add(ev.getId())) {
        continue;
      }
      String msg = mensajeEvaluadorPendiente(ev.getId());
      if (msg == null) {
        continue;
      }
      Map<String, String> vars = new HashMap<>();
      vars.put("tarea", msg);
      vars.put("enlace", "/evaluador");
      vars.put("proximo_paso", "Ingresá a tu panel de evaluador y completá lo pendiente.");
      notificacionService.enviarConPlantilla(ev.getId(), PLANTILLA_PENDIENTE, vars);
      enviados++;
    }

    List<Trabajo> observados =
        trabajoDAO.listarFiltrado(
            new TrabajoFiltro(null, null, null, EstadoTrabajo.PRECHECK_OBSERVADO, null, null, null),
            0,
            2000);
    observados.addAll(
        trabajoDAO.listarFiltrado(
            new TrabajoFiltro(
                null, null, null, EstadoTrabajo.OBSERVADO_EVALUACION, null, null, null),
            0,
            2000));

    for (Trabajo t : observados) {
      Usuario autor = t.getAutor();
      if (autor == null || autor.getId() == null || !yaAvisados.add(autor.getId())) {
        continue;
      }
      boolean esAutor = autor.getRoles().contains(Rol.AUTOR);
      Map<String, String> vars = new HashMap<>();
      vars.put("tarea", "Tenés trabajos observados pendientes de corregir y reenviar.");
      vars.put("enlace", esAutor ? "/autor/trabajos" : "/asistente/trabajos");
      vars.put("proximo_paso", "Ingresá a Mis trabajos, corregí y volvé a enviar.");
      notificacionService.enviarConPlantilla(autor.getId(), PLANTILLA_PENDIENTE, vars);
      enviados++;
    }

    return new AlertaEnvioResultadoDTO(
        0,
        enviados,
        enviados == 0
            ? "No hay usuarios con tareas pendientes para recordar."
            : "Se enviaron " + enviados + " recordatorio(s) a usuarios con pendientes.");
  }

  public AlertaEnvioResultadoDTO notificarTodo() {
    AlertaEnvioResultadoDTO org = notificarOrganizacion();
    AlertaEnvioResultadoDTO users = notificarPendientesUsuarios();
    return new AlertaEnvioResultadoDTO(
        org.notificacionesOrganizacion(),
        users.recordatoriosUsuarios(),
        org.mensaje() + " " + users.mensaje());
  }

  private String mensajeEvaluadorPendiente(Long evaluadorId) {
    List<AsignacionEvaluacion> list = asignacionEvaluacionDAO.listarPorEvaluador(evaluadorId);
    long sinRespuesta = list.stream().filter(a -> a.getFechaRespuesta() == null).count();
    long sinDictamen =
        list.stream()
            .filter(a -> a.isAceptada() && a.getFechaRespuesta() != null && a.getEvaluacion() == null)
            .count();
    if (sinRespuesta == 0 && sinDictamen == 0) {
      return null;
    }
    List<String> partes = new ArrayList<>();
    if (sinRespuesta > 0) {
      partes.add(sinRespuesta + " invitación(es) sin respuesta");
    }
    if (sinDictamen > 0) {
      partes.add(sinDictamen + " dictamen(es) pendiente(s)");
    }
    return "Tenés pendientes: " + String.join(" y ", partes) + ".";
  }
}
