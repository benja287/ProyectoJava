package ar.edu.unlp.jyaa.grupo1.web.dto;

public record DeudorInscripcionDTO(
    Long id,
    String nombre,
    String email,
    String metodoPago,
    String categoria) {}
