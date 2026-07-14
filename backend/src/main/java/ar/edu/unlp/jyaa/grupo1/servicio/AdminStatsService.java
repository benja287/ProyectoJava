package ar.edu.unlp.jyaa.grupo1.servicio;

import ar.edu.unlp.jyaa.grupo1.dao.AsignacionEvaluacionDAO;
import ar.edu.unlp.jyaa.grupo1.dao.CronogramaPersonalDAO;
import ar.edu.unlp.jyaa.grupo1.dao.InscripcionCongresoDAO;
import ar.edu.unlp.jyaa.grupo1.dao.PagoDAO;
import ar.edu.unlp.jyaa.grupo1.dao.TrabajoDAO;
import ar.edu.unlp.jyaa.grupo1.dao.UsuarioDAO;
import ar.edu.unlp.jyaa.grupo1.dao.filtro.InscripcionFiltro;
import ar.edu.unlp.jyaa.grupo1.dao.filtro.PagoFiltro;
import ar.edu.unlp.jyaa.grupo1.dao.filtro.TrabajoFiltro;
import ar.edu.unlp.jyaa.grupo1.modelo.Actividad;
import ar.edu.unlp.jyaa.grupo1.modelo.AsignacionEvaluacion;
import ar.edu.unlp.jyaa.grupo1.modelo.CategoriaInscripcion;
import ar.edu.unlp.jyaa.grupo1.modelo.CronogramaPersonal;
import ar.edu.unlp.jyaa.grupo1.modelo.EstadoInscripcion;
import ar.edu.unlp.jyaa.grupo1.modelo.EstadoPago;
import ar.edu.unlp.jyaa.grupo1.modelo.EstadoTrabajo;
import ar.edu.unlp.jyaa.grupo1.modelo.InscripcionCongreso;
import ar.edu.unlp.jyaa.grupo1.modelo.MetodoPago;
import ar.edu.unlp.jyaa.grupo1.modelo.ModalidadPresentacion;
import ar.edu.unlp.jyaa.grupo1.modelo.Pago;
import ar.edu.unlp.jyaa.grupo1.modelo.TipoTrabajo;
import ar.edu.unlp.jyaa.grupo1.modelo.Trabajo;
import ar.edu.unlp.jyaa.grupo1.web.dto.AdminReportDTO;
import ar.edu.unlp.jyaa.grupo1.web.dto.AdminReportKpiDTO;
import ar.edu.unlp.jyaa.grupo1.web.dto.AdminStatsDTO;
import ar.edu.unlp.jyaa.grupo1.web.dto.ConteoLabelDTO;
import ar.edu.unlp.jyaa.grupo1.web.dto.DeudorInscripcionDTO;
import ar.edu.unlp.jyaa.grupo1.web.dto.InstitucionConteoDTO;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import java.time.Instant;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RequestScoped
public class AdminStatsService {

  @Inject private UsuarioDAO usuarioDAO;
  @Inject private PagoDAO pagoDAO;
  @Inject private InscripcionCongresoDAO inscripcionDAO;
  @Inject private TrabajoDAO trabajoDAO;
  @Inject private AsignacionEvaluacionDAO asignacionEvaluacionDAO;
  @Inject private CronogramaPersonalDAO cronogramaPersonalDAO;

  public AdminStatsDTO obtener() {
    long pendientesPago =
        pagoDAO.contarFiltrado(new PagoFiltro(EstadoPago.PENDIENTE, null, null, null));
    long confirmadas =
        inscripcionDAO.contarFiltrado(
            new InscripcionFiltro(EstadoInscripcion.APROBADA, null, null));
    long trabajos =
        trabajoDAO.contarFiltrado(new TrabajoFiltro(null, null, null, null, null, null, null));
    long aprobados =
        trabajoDAO.contarFiltrado(
            new TrabajoFiltro(null, null, null, EstadoTrabajo.APROBADO, null, null, null));
    long talleresPendientes =
        trabajoDAO.contarFiltrado(
            new TrabajoFiltro(
                null,
                null,
                null,
                EstadoTrabajo.ENVIADO,
                null,
                TipoTrabajo.PROPUESTA_TALLER,
                null));
    return new AdminStatsDTO(
        usuarioDAO.contar(),
        pendientesPago,
        confirmadas,
        trabajos,
        aprobados,
        talleresPendientes);
  }

  public AdminReportDTO obtenerReporte() {
    List<InscripcionCongreso> inscripciones = inscripcionDAO.listarTodos();
    List<Trabajo> trabajos =
        trabajoDAO.listarFiltrado(new TrabajoFiltro(null, null, null, null, null, null, null), 0, 5000);
    List<AsignacionEvaluacion> asignaciones = asignacionEvaluacionDAO.listarTodos();

    long pendientes =
        inscripciones.stream().filter(i -> i.getEstado() == EstadoInscripcion.PENDIENTE).count();
    long confirmadas =
        inscripciones.stream().filter(i -> i.getEstado() == EstadoInscripcion.APROBADA).count();

    long efectivoPend = contarPagos(EstadoPago.PENDIENTE, MetodoPago.EFECTIVO);
    long transferenciaPend = contarPagos(EstadoPago.PENDIENTE, MetodoPago.TRANSFERENCIA);
    long efectivoOk = contarPagos(EstadoPago.APROBADO, MetodoPago.EFECTIVO);
    long transferenciaOk = contarPagos(EstadoPago.APROBADO, MetodoPago.TRANSFERENCIA);

    long invitacionesPendientes =
        asignaciones.stream().filter(a -> a.getFechaRespuesta() == null).count();
    long dictamenesPendientes =
        asignaciones.stream()
            .filter(a -> a.isAceptada() && a.getFechaRespuesta() != null && a.getEvaluacion() == null)
            .count();
    long trabajosEnEvaluacion =
        trabajos.stream().filter(t -> t.getEstado() == EstadoTrabajo.EN_EVALUACION).count();
    long trabajosPendientesPrecheck =
        trabajos.stream().filter(t -> t.getEstado() == EstadoTrabajo.ENVIADO).count();

    AdminReportKpiDTO kpi =
        new AdminReportKpiDTO(
            usuarioDAO.contar(),
            inscripciones.size(),
            pendientes,
            confirmadas,
            efectivoPend,
            transferenciaPend,
            efectivoOk,
            transferenciaOk,
            trabajos.size(),
            dictamenesPendientes,
            invitacionesPendientes,
            trabajosEnEvaluacion,
            trabajosPendientesPrecheck);

    Map<TipoTrabajo, Long> porTipo = new EnumMap<>(TipoTrabajo.class);
    Map<ModalidadPresentacion, Long> porModalidad = new EnumMap<>(ModalidadPresentacion.class);
    Map<EstadoTrabajo, Long> porEstado = new EnumMap<>(EstadoTrabajo.class);
    Map<String, Long> porEje = new HashMap<>();
    for (Trabajo t : trabajos) {
      if (t.getTipo() != null) {
        porTipo.merge(t.getTipo(), 1L, Long::sum);
      }
      if (t.getModalidad() != null) {
        porModalidad.merge(t.getModalidad(), 1L, Long::sum);
      }
      if (t.getEstado() != null) {
        porEstado.merge(t.getEstado(), 1L, Long::sum);
      }
      String eje =
          t.getEjeTematico() == null || t.getEjeTematico().isBlank()
              ? "Sin eje"
              : t.getEjeTematico().trim();
      porEje.merge(eje, 1L, Long::sum);
    }

    Map<String, Long> porCategoria = new LinkedHashMap<>();
    Map<String, Long> porProvincia = new HashMap<>();
    Map<String, Long> porInstitucion = new HashMap<>();
    for (InscripcionCongreso i : inscripciones) {
      String cat =
          i.getCategoria() == null || i.getCategoria().isBlank()
              ? "Sin categoría"
              : etiquetaCategoria(i.getCategoria());
      porCategoria.merge(cat, 1L, Long::sum);

      String prov =
          i.getProvincia() == null || i.getProvincia().isBlank()
              ? "Sin provincia"
              : i.getProvincia().trim();
      porProvincia.merge(prov, 1L, Long::sum);

      String inst =
          i.getInstitucion() == null || i.getInstitucion().isBlank()
              ? "Sin institución"
              : i.getInstitucion().trim();
      porInstitucion.merge(inst, 1L, Long::sum);
    }

    List<DeudorInscripcionDTO> deudores = new ArrayList<>();
    for (InscripcionCongreso i : inscripciones) {
      Pago pago = i.getPago();
      boolean adeuda =
          i.getEstado() == EstadoInscripcion.PENDIENTE
              || (pago != null && pago.getEstado() == EstadoPago.PENDIENTE);
      if (!adeuda) {
        continue;
      }
      String metodo =
          pago == null
              ? "—"
              : pago.getMetodo() == MetodoPago.EFECTIVO ? "efectivo" : "transferencia";
      deudores.add(
          new DeudorInscripcionDTO(
              i.getUsuario().getId(),
              (i.getUsuario().getNombre() + " " + i.getUsuario().getApellido()).trim(),
              i.getUsuario().getEmail(),
              metodo,
              i.getCategoria()));
    }

    return new AdminReportDTO(
        Instant.now().toString(),
        kpi,
        toConteoEnumTipo(porTipo),
        toConteoModalidad(porModalidad),
        toConteoEstado(porEstado),
        toConteoString(porEje),
        toConteoString(porCategoria),
        toConteoString(porProvincia),
        topInstituciones(porInstitucion),
        interesPorActividad(),
        deudores);
  }

  private List<ConteoLabelDTO> interesPorActividad() {
    Map<Long, String> titulos = new HashMap<>();
    Map<Long, Long> conteos = new HashMap<>();
    for (CronogramaPersonal cronograma : cronogramaPersonalDAO.listarTodos()) {
      if (cronograma.getActividades() == null) {
        continue;
      }
      for (Actividad actividad : cronograma.getActividades()) {
        if (actividad == null || actividad.getId() == null) {
          continue;
        }
        String titulo =
            actividad.getTitulo() != null && !actividad.getTitulo().isBlank()
                ? actividad.getTitulo().trim()
                : ("Actividad #" + actividad.getId());
        if (actividad.getCodigo() != null && !actividad.getCodigo().isBlank()) {
          titulo = actividad.getCodigo().trim() + " — " + titulo;
        }
        titulos.putIfAbsent(actividad.getId(), titulo);
        conteos.merge(actividad.getId(), 1L, Long::sum);
      }
    }
    return conteos.entrySet().stream()
        .sorted(Map.Entry.<Long, Long>comparingByValue().reversed())
        .limit(15)
        .map(e -> new ConteoLabelDTO(titulos.get(e.getKey()), e.getValue()))
        .toList();
  }

  private long contarPagos(EstadoPago estado, MetodoPago metodo) {
    return pagoDAO.listarFiltrado(new PagoFiltro(estado, null, null, null), 0, 5000).stream()
        .filter(p -> p.getMetodo() == metodo)
        .count();
  }

  private List<ConteoLabelDTO> toConteoEnumTipo(Map<TipoTrabajo, Long> map) {
    return map.entrySet().stream()
        .sorted(Map.Entry.<TipoTrabajo, Long>comparingByValue().reversed())
        .map(e -> new ConteoLabelDTO(etiquetaTipo(e.getKey()), e.getValue()))
        .toList();
  }

  private List<ConteoLabelDTO> toConteoModalidad(Map<ModalidadPresentacion, Long> map) {
    return map.entrySet().stream()
        .sorted(Map.Entry.<ModalidadPresentacion, Long>comparingByValue().reversed())
        .map(
            e ->
                new ConteoLabelDTO(
                    e.getKey() == ModalidadPresentacion.ORAL ? "Oral" : "Póster", e.getValue()))
        .toList();
  }

  private List<ConteoLabelDTO> toConteoEstado(Map<EstadoTrabajo, Long> map) {
    return map.entrySet().stream()
        .sorted(Map.Entry.<EstadoTrabajo, Long>comparingByValue().reversed())
        .map(e -> new ConteoLabelDTO(etiquetaEstado(e.getKey()), e.getValue()))
        .toList();
  }

  private List<ConteoLabelDTO> toConteoString(Map<String, Long> map) {
    return map.entrySet().stream()
        .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
        .map(e -> new ConteoLabelDTO(e.getKey(), e.getValue()))
        .toList();
  }

  private List<InstitucionConteoDTO> topInstituciones(Map<String, Long> map) {
    return map.entrySet().stream()
        .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
        .limit(10)
        .map(e -> new InstitucionConteoDTO(e.getKey(), e.getValue()))
        .toList();
  }

  private static String etiquetaTipo(TipoTrabajo tipo) {
    return switch (tipo) {
      case TRABAJO_CIENTIFICO -> "Trabajo científico";
      case RELATO_DE_EXPERIENCIA -> "Relato de experiencia";
      case PROPUESTA_TALLER -> "Propuesta de taller";
    };
  }

  private static String etiquetaEstado(EstadoTrabajo estado) {
    return switch (estado) {
      case BORRADOR -> "Borrador";
      case ENVIADO -> "Enviado — pendiente de prevalidación";
      case PRECHECK_OK -> "Prevalidación aprobada";
      case PRECHECK_OBSERVADO -> "Observado en prevalidación";
      case EN_EVALUACION -> "En evaluación";
      case PENDIENTE_APROBACION_COMITE -> "Pendiente de dictamen del comité";
      case APROBADO -> "Aprobado";
      case OBSERVADO_EVALUACION -> "Requiere correcciones (evaluación)";
      case RECHAZADO -> "Rechazado";
      case NOTIFICADO -> "Presentación notificada";
      case PROGRAMADO -> "Programado en el cronograma";
    };
  }

  private static String etiquetaCategoria(String raw) {
    try {
      return switch (CategoriaInscripcion.valueOf(raw.trim().toUpperCase())) {
        case SOCIO_SAAE -> "Socio/a SAAE";
        case NO_SOCIO -> "No socio/a";
        case ESTUDIANTE -> "Estudiante de grado";
        case PRODUCTOR -> "Productor/a";
        case INVESTIGADOR -> "Investigador/a";
        case EXTENSIONISTA -> "Extensionista";
        case DOCENTE -> "Docente";
        case EXTRANJERO -> "Extranjero/a";
      };
    } catch (IllegalArgumentException e) {
      return raw;
    }
  }
}
