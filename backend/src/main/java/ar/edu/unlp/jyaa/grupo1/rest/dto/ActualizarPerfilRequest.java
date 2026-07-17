package ar.edu.unlp.jyaa.grupo1.rest.dto;

public record ActualizarPerfilRequest(
    String nombre,
    String apellido,
    String email,
    String telefono,
    String tipoIdentificacion,
    String numeroIdentificacion,
    String nacionalidad,
    /** Categoría tarifaria (útil para cuentas viejas sin categoría). */
    String categoriaInscripcion,
    /** Obligatoria solo si se envía passwordNueva. */
    String passwordActual,
    String passwordNueva) {}
