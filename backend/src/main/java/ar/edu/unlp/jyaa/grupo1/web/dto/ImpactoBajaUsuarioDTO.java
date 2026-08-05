package ar.edu.unlp.jyaa.grupo1.web.dto;

/** Vista previa para confirmar una baja definitiva desde Gestión de usuarios. */
public record ImpactoBajaUsuarioDTO(
    int inscripciones, int pagos, int trabajos, long evaluaciones, boolean bloqueado) {}
