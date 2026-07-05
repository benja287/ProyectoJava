package ar.edu.unlp.jyaa.grupo1.web.dto;

public record AdminReportKpiDTO(
    long usuariosTotales,
    long inscripcionesTotales,
    long inscripcionesPendientes,
    long inscripcionesConfirmadas,
    long pagosEfectivoPendientes,
    long pagosTransferenciaPendientes,
    long pagosEfectivoConfirmados,
    long pagosTransferenciaConfirmados,
    long trabajosTotales) {}
