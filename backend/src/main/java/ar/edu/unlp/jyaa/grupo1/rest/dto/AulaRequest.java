package ar.edu.unlp.jyaa.grupo1.rest.dto;

public record AulaRequest(
    String nombre,
    Integer capacidad,
    String ubicacion,
    Boolean activa,
    Double latitud,
    Double longitud) {}
