package ar.edu.unlp.jyaa.grupo1.web.dto;

import java.util.List;

public record AdminReportDTO(
    String generatedAt,
    AdminReportKpiDTO kpi,
    List<ConteoLabelDTO> trabajosPorTipo,
    List<ConteoLabelDTO> trabajosPorModalidad,
    List<ConteoLabelDTO> trabajosPorEstado,
    List<InstitucionConteoDTO> inscripcionesPorInstitucionTop10,
    List<DeudorInscripcionDTO> deudores) {}
