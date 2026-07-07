package ar.edu.unlp.jyaa.grupo1.rest.dto;

public record CircularRequest(
    String titulo, String resumen, String contenido, String fechaPublicacion, Boolean publicada) {}
