package ar.edu.unlp.jyaa.grupo1.web.dto;

import java.util.List;

/** Configuración de aranceles y datos de pago (vista participante o admin). */
public record ArancelesConfigDTO(
    boolean publicados,
    boolean ventanaInscripcionAbierta,
    boolean puedeInscribirseAhora,
    String motivoBloqueo,
    String aliasPago,
    String qrPagoUrl,
    String instruccionesPago,
    List<ArancelCategoriaDTO> aranceles) {}
