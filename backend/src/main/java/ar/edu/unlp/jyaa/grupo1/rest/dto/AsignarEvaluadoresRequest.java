package ar.edu.unlp.jyaa.grupo1.rest.dto;

import java.util.List;

public record AsignarEvaluadoresRequest(
    Long trabajoId, List<Long> evaluadorIds, boolean tercerEvaluadorEmpate) {}
