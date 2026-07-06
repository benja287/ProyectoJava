package ar.edu.unlp.jyaa.grupo1.rest.dto;

import java.util.List;

public record TrabajoUpdateRequest(
    String titulo,
    String resumen,
    String ejeTematico,
    String modalidad,
    String tipo,
    List<String> coautores) {}
