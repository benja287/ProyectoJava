package ar.edu.unlp.jyaa.grupo1.web.dto;

import java.time.LocalDate;

public record TrabajoEnvioResumenDTO(
    int trabajosEnviadosRol,
    int totalHistorico,
    int trabajosActivos,
    int reenviosDisponibles,
    int limiteActivos,
    boolean puedeEnviarNuevo,
    boolean bloqueadoPorDobleRol,
    String mensajeBloqueo,
    LocalDate envioTrabajosHasta,
    boolean fechaLimitePasada) {}
