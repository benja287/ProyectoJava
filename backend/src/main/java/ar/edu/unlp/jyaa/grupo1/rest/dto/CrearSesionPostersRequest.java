package ar.edu.unlp.jyaa.grupo1.rest.dto;

import java.time.LocalDateTime;
import java.util.List;

public record CrearSesionPostersRequest(
    String titulo,
    String ubicacion,
    LocalDateTime inicio,
    LocalDateTime fin,
    List<Long> trabajoIds,
    Long aulaId) {}
