package ar.edu.unlp.jyaa.grupo1.rest.dto;

public record RegistroParticipanteRequest(
    String nombre,
    String apellido,
    String email,
    String password,
    String categoria) {}
