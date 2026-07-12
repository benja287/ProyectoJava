package ar.edu.unlp.jyaa.grupo1.web.dto;

import java.util.List;

public record PaginaAsignacionesDTO(
    List<AsignacionEvaluacionDTO> items, int page, int size, long total, int totalPages) {}
