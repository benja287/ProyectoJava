package ar.edu.unlp.jyaa.grupo1.rest.dto;

import java.time.LocalDateTime;
import java.util.List;

public record CrearMesaTematicaRequest(
    String codigo,
    String titulo,
    String sala,
    LocalDateTime inicio,
    LocalDateTime fin,
    List<Long> trabajoIds,
    Long aulaId,
    Long franjaId) {}
