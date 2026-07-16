package ar.edu.unlp.jyaa.grupo1.servicio;

import ar.edu.unlp.jyaa.grupo1.dao.AsignacionEvaluacionDAO;
import ar.edu.unlp.jyaa.grupo1.dao.CongresoDAO;
import ar.edu.unlp.jyaa.grupo1.dao.EvaluacionDAO;
import ar.edu.unlp.jyaa.grupo1.modelo.AsignacionEvaluacion;
import ar.edu.unlp.jyaa.grupo1.modelo.Congreso;
import ar.edu.unlp.jyaa.grupo1.modelo.EstadoTrabajo;
import ar.edu.unlp.jyaa.grupo1.modelo.Evaluacion;
import ar.edu.unlp.jyaa.grupo1.modelo.ModalidadRecomendadaEvaluacion;
import ar.edu.unlp.jyaa.grupo1.modelo.RecomendacionEvaluacion;
import ar.edu.unlp.jyaa.grupo1.rest.dto.EvaluacionRequest;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDate;

@RequestScoped
public class EvaluacionService {

  @Inject private AsignacionEvaluacionDAO asignacionEvaluacionDAO;
  @Inject private EvaluacionDAO evaluacionDAO;
  @Inject private CongresoDAO congresoDAO;
  @Inject private TrabajoService trabajoService;
  @Inject private DocumentStorageService documentStorageService;
  @Inject private EvaluadorEjeService evaluadorEjeService;

  public Evaluacion registrar(EvaluacionRequest request) {
    if (request == null || request.asignacionId() == null) {
      throw new NegocioException("Debe indicar la asignación");
    }
    if (request.recomendacion() == null) {
      throw new NegocioException("Debe indicar la decisión final del dictamen");
    }
    return registrar(
        request.asignacionId(),
        request.recomendacion(),
        request.comentario(),
        request.comentarioComite(),
        request.modalidadRecomendada(),
        request.rubricaJson());
  }

  /** Compatibilidad con llamadas antiguas (solo recomendación + comentario al autor). */
  public Evaluacion registrar(
      Long asignacionId, RecomendacionEvaluacion recomendacion, String comentario) {
    return registrar(asignacionId, recomendacion, comentario, null, null, null);
  }

  public Evaluacion registrar(
      Long asignacionId,
      RecomendacionEvaluacion recomendacion,
      String comentarioAutor,
      String comentarioComite,
      ModalidadRecomendadaEvaluacion modalidadRecomendada,
      String rubricaJson) {
    AsignacionEvaluacion asignacion =
        asignacionEvaluacionDAO
            .recuperarPorIdConDetalle(asignacionId)
            .orElseThrow(() -> new NegocioException("Asignación no encontrada: " + asignacionId));
    if (!asignacion.isAceptada()) {
      throw new NegocioException("Debe aceptar la asignación antes de evaluar el trabajo");
    }
    if (asignacion.getEvaluacion() != null) {
      throw new NegocioException("Ya registró una evaluación para este trabajo");
    }
    if (asignacion.getTrabajo().getEstado() != EstadoTrabajo.EN_EVALUACION) {
      throw new NegocioException("El trabajo no está en evaluación");
    }
    if (asignacion.getTrabajo().getAutor() != null
        && asignacion.getEvaluador() != null
        && asignacion.getTrabajo().getAutor().getId().equals(asignacion.getEvaluador().getId())) {
      throw new NegocioException("No podés evaluar tu propio trabajo");
    }
    validarVentanaEvaluacion();

    Evaluacion evaluacion = new Evaluacion();
    evaluacion.setAsignacion(asignacion);
    evaluacion.setRecomendacion(recomendacion);
    evaluacion.setComentario(blankToNull(comentarioAutor));
    evaluacion.setComentarioComite(blankToNull(comentarioComite));
    evaluacion.setModalidadRecomendada(modalidadRecomendada);
    evaluacion.setRubricaJson(blankToNull(rubricaJson));
    evaluacion.setFecha(LocalDate.now());
    asignacion.setEvaluacion(evaluacion);
    Evaluacion guardada = evaluacionDAO.alta(evaluacion);

    // Libera 1 cupo del eje: el evaluador ya dictaminó → el comité puede asignarle otro trabajo.
    if (asignacion.getEvaluador() != null && asignacion.getTrabajo() != null) {
      evaluadorEjeService.devolverCupo(
          asignacion.getEvaluador().getId(), asignacion.getTrabajo().getEjeTematico());
    }

    Long trabajoId = asignacion.getTrabajo().getId();
    trabajoService.actualizarEstadoTrasEvaluaciones(trabajoId);
    return guardada;
  }

  public Evaluacion adjuntarArchivoCorreccion(Long evaluacionId, InputStream contenido, String filename) {
    Evaluacion evaluacion = evaluacionDAO.recuperarPorId(evaluacionId);
    if (evaluacion == null) {
      throw new NegocioException("Evaluación no encontrada: " + evaluacionId);
    }
    if (!permiteArchivoCorreccion(evaluacion.getRecomendacion())) {
      throw new NegocioException(
          "Solo se puede adjuntar archivo de correcciones cuando el dictamen es "
              + "aceptado con correcciones menores o requiere modificaciones profundas");
    }
    try {
      if (evaluacion.getArchivoCorreccionUrl() != null) {
        documentStorageService.eliminarPorUrl(evaluacion.getArchivoCorreccionUrl());
      }
      String url =
          documentStorageService.guardar(
              DocumentStorageService.TipoArchivo.EVALUACION_CORRECCION, filename, contenido);
      evaluacion.setArchivoCorreccionUrl(url);
      evaluacion.setArchivoCorreccionNombre(
          filename != null && !filename.isBlank() ? filename.trim() : "correcciones.pdf");
      return evaluacionDAO.modificar(evaluacion);
    } catch (IOException e) {
      throw new NegocioException("No se pudo guardar el archivo de correcciones");
    }
  }

  /** Adjunto útil solo si hay algo que corregir (menores o profundas). */
  static boolean permiteArchivoCorreccion(RecomendacionEvaluacion recomendacion) {
    return recomendacion == RecomendacionEvaluacion.APROBADO_CON_CORRECCIONES
        || recomendacion == RecomendacionEvaluacion.RECHAZADO;
  }

  public Evaluacion buscar(Long id) {
    Evaluacion evaluacion = evaluacionDAO.recuperarPorId(id);
    if (evaluacion == null) {
      throw new NegocioException("Evaluación no encontrada: " + id);
    }
    return evaluacion;
  }

  private void validarVentanaEvaluacion() {
    Congreso congreso = congresoDAO.obtenerPrincipal();
    LocalDate hasta = congreso.getEvaluacionHasta();
    if (hasta != null && LocalDate.now().isAfter(hasta)) {
      throw new NegocioException(
          "El período de evaluación cerró el " + hasta + ". Ya no se pueden registrar dictámenes.");
    }
  }

  private static String blankToNull(String value) {
    return value != null && !value.isBlank() ? value.trim() : null;
  }
}
