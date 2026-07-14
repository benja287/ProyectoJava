package ar.edu.unlp.jyaa.grupo1.web.dto;

import java.time.LocalDate;

/** Resultado de finalizar el congreso y emitir certificados en masa. */
public record FinalizarCertificadosResultadoDTO(
    LocalDate certificadosDisponiblesDesde,
    int certificadosCreados,
    int certificadosYaExistentes,
    int notificacionesEnviadas) {}
