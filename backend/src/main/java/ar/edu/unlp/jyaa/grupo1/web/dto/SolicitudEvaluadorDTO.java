package ar.edu.unlp.jyaa.grupo1.web.dto;

import ar.edu.unlp.jyaa.grupo1.modelo.SolicitudEvaluador;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

public record SolicitudEvaluadorDTO(
    Long id,
    Long usuarioId,
    String usuarioNombre,
    String usuarioApellido,
    String estado,
    LocalDateTime fechaSolicitud,
    LocalDateTime fechaRevision,
    Long revisadoPorId,
    String revisadoPorNombre,
    String motivoRechazo,
    String nombreCompleto,
    String email,
    String tipoIdentificacion,
    String numeroIdentificacion,
    String nacionalidad,
    String institucion,
    boolean evaluoEdicionesCongreso,
    boolean evaluoOtrosCongresos,
    String formacionAgroecologia,
    Set<String> areasConocimiento,
    Set<String> subareas,
    List<CapacidadEjeDTO> capacidades,
    /** Cupos vivos del evaluador (restantes / max) tras aprobar. */
    List<EvaluadorEjeCupoDTO> cuposAsignados,
    String observaciones,
    String ejeAsignado,
    boolean invitacionTallerEnviada) {

  public static SolicitudEvaluadorDTO from(SolicitudEvaluador s) {
    return from(s, List.of());
  }

  public static SolicitudEvaluadorDTO from(
      SolicitudEvaluador s, List<EvaluadorEjeCupoDTO> cuposAsignados) {
    var u = s.getUsuario();
    var rev = s.getRevisadoPor();
    List<CapacidadEjeDTO> caps =
        s.getCapacidades() == null
            ? List.of()
            : s.getCapacidades().stream().map(CapacidadEjeDTO::from).toList();
    return new SolicitudEvaluadorDTO(
        s.getId(),
        u != null ? u.getId() : null,
        u != null ? u.getNombre() : null,
        u != null ? u.getApellido() : null,
        s.getEstado() != null ? s.getEstado().name() : null,
        s.getFechaSolicitud(),
        s.getFechaRevision(),
        rev != null ? rev.getId() : null,
        rev != null ? (rev.getNombre() + " " + rev.getApellido()).trim() : null,
        s.getMotivoRechazo(),
        s.getNombreCompleto(),
        s.getEmail(),
        s.getTipoIdentificacion(),
        s.getNumeroIdentificacion(),
        s.getNacionalidad(),
        s.getInstitucion(),
        s.isEvaluoEdicionesCongreso(),
        s.isEvaluoOtrosCongresos(),
        s.getFormacionAgroecologia(),
        s.getAreasConocimiento(),
        s.getSubareas(),
        caps,
        cuposAsignados != null ? cuposAsignados : List.of(),
        s.getObservaciones(),
        s.getEjeAsignado(),
        s.isInvitacionTallerEnviada());
  }
}
