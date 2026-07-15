package ar.edu.unlp.jyaa.grupo1.rest.dto;

public record ActualizarPerfilRequest(
    String nombre,
    String apellido,
    String email,
    /** Obligatoria solo si se envía passwordNueva. */
    String passwordActual,
    String passwordNueva) {}
