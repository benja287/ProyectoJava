package ar.edu.unlp.jyaa.grupo1.servicio;

import ar.edu.unlp.jyaa.grupo1.dao.InscripcionCongresoDAO;
import ar.edu.unlp.jyaa.grupo1.dao.PagoDAO;
import ar.edu.unlp.jyaa.grupo1.dao.TrabajoDAO;
import ar.edu.unlp.jyaa.grupo1.dao.UsuarioDAO;
import ar.edu.unlp.jyaa.grupo1.dao.filtro.InscripcionFiltro;
import ar.edu.unlp.jyaa.grupo1.dao.filtro.PagoFiltro;
import ar.edu.unlp.jyaa.grupo1.dao.filtro.TrabajoFiltro;
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
import java.util.List;
import java.util.Map;

@RequestScoped
public class AdminStatsService {

  @Inject private UsuarioDAO usuarioDAO;
  @Inject private PagoDAO pagoDAO;
  @Inject private InscripcionCongresoDAO inscripcionDAO;
  @Inject private TrabajoDAO trabajoDAO;

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

    long pendientes =
        inscripciones.stream().filter(i -> i.getEstado() == EstadoInscripcion.PENDIENTE).count();
    long confirmadas =
        inscripciones.stream().filter(i -> i.getEstado() == EstadoInscripcion.APROBADA).count();

    long efectivoPend =
        contarPagos(EstadoPago.PENDIENTE, MetodoPago.EFECTIVO);
    long transferenciaPend =
        contarPagos(EstadoPago.PENDIENTE, MetodoPago.TRANSFERENCIA);
    long efectivoOk = contarPagos(EstadoPago.APROBADO, MetodoPago.EFECTIVO);
    long transferenciaOk = contarPagos(EstadoPago.APROBADO, MetodoPago.TRANSFERENCIA);

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
            trabajos.size());

    Map<TipoTrabajo, Long> porTipo = new EnumMap<>(TipoTrabajo.class);
    Map<ModalidadPresentacion, Long> porModalidad = new EnumMap<>(ModalidadPresentacion.class);
    Map<EstadoTrabajo, Long> porEstado = new EnumMap<>(EstadoTrabajo.class);
    for (Trabajo t : trabajos) {
      porTipo.merge(t.getTipo(), 1L, Long::sum);
      if (t.getModalidad() != null) {
        porModalidad.merge(t.getModalidad(), 1L, Long::sum);
      }
      porEstado.merge(t.getEstado(), 1L, Long::sum);
    }

    Map<String, Long> porInstitucion = new HashMap<>();
    for (InscripcionCongreso i : inscripciones) {
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
        toConteoList(porTipo),
        toConteoModalidad(porModalidad),
        toConteoEstado(porEstado),
        topInstituciones(porInstitucion),
        deudores);
  }

  private long contarPagos(EstadoPago estado, MetodoPago metodo) {
    return pagoDAO.listarFiltrado(new PagoFiltro(estado, null, null, null), 0, 5000).stream()
        .filter(p -> p.getMetodo() == metodo)
        .count();
  }

  private List<ConteoLabelDTO> toConteoList(Map<TipoTrabajo, Long> map) {
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
        .map(e -> new ConteoLabelDTO(e.getKey().name(), e.getValue()))
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
}
