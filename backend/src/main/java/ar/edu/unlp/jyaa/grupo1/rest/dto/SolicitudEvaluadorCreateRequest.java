package ar.edu.unlp.jyaa.grupo1.rest.dto;

import java.util.List;
import java.util.Set;

public record SolicitudEvaluadorCreateRequest(
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
    List<CapacidadEjeRequest> capacidades,
    String observaciones) {}
