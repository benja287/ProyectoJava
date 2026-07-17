package ar.edu.unlp.jyaa.grupo1.rest.dto;

public record ValidacionInscripcionRequest(
    boolean aprobar,
    String motivoRechazo,
    String numeroRecibo,
    String observaciones,
    Boolean efectivoFisicoRecibido) {}
