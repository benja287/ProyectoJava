package ar.edu.unlp.jyaa.grupo1.rest.dto;

public record CongresoConfigUpdateRequest(
    Boolean programaPublicado,
    String certificadosDisponiblesDesde,
    String envioTrabajosHasta,
    String congresoDesde,
    String congresoHasta,
    String inscripcionesDesde,
    String inscripcionesHasta,
    String evaluacionHasta) {}
