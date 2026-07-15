package ar.edu.unlp.jyaa.grupo1.rest.dto;

import java.util.List;

public record ArancelesConfigUpdateRequest(
    String aliasPago,
    String instruccionesPago,
    /** true = publicar (valida completo); false = despublicar; null = solo guardar borrador. */
    Boolean publicar,
    List<ArancelCategoriaRequest> aranceles) {}
