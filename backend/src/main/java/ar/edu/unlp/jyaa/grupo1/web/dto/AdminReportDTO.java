package ar.edu.unlp.jyaa.grupo1.web.dto;

import java.util.List;

public record AdminReportDTO(
    String generatedAt,
    AdminReportKpiDTO kpi,
    List<ConteoLabelDTO> trabajosPorTipo,
    List<ConteoLabelDTO> trabajosPorModalidad,
    List<ConteoLabelDTO> trabajosPorEstado,
    List<ConteoLabelDTO> trabajosPorEje,
    List<ConteoLabelDTO> inscripcionesPorCategoria,
    List<ConteoLabelDTO> inscripcionesPorProvincia,
    List<InstitucionConteoDTO> inscripcionesPorInstitucionTop10,
    List<ConteoLabelDTO> interesPorActividad,
    List<DeudorInscripcionDTO> deudores) {}
