package ar.edu.unlp.jyaa.grupo1.web.dto;

import java.time.LocalDate;
import java.util.List;

/** Respuesta del hub de certificados del usuario autenticado. */
public record MisCertificadosDTO(
    boolean habilitados,
    LocalDate disponiblesDesde,
    List<CertificadoItemDTO> items) {}
