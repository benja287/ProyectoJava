package ar.edu.unlp.jyaa.grupo1.web.dto;

import ar.edu.unlp.jyaa.grupo1.modelo.EstadoInscripcion;
import ar.edu.unlp.jyaa.grupo1.modelo.InscripcionCongreso;
import ar.edu.unlp.jyaa.grupo1.modelo.Pago;
import java.time.LocalDate;

public record InscripcionCongresoDTO(
    Long id,
    String categoria,
    EstadoInscripcion estado,
    LocalDate fechaSolicitud,
    String motivoRechazo,
    String institucion,
    String provincia,
    boolean requiereFactura,
    String certificadoUrl,
    Long usuarioId,
    String usuarioNombre,
    String usuarioApellido,
    String usuarioEmail,
    Long pagoId,
    Double pagoMonto,
    String pagoEstado,
    String pagoMetodo,
    String pagoComprobanteUrl) {

  public static InscripcionCongresoDTO from(InscripcionCongreso inscripcion) {
    Pago pago = inscripcion.getPago();
    return new InscripcionCongresoDTO(
        inscripcion.getId(),
        inscripcion.getCategoria(),
        inscripcion.getEstado(),
        inscripcion.getFechaSolicitud(),
        inscripcion.getMotivoRechazo(),
        inscripcion.getInstitucion(),
        inscripcion.getProvincia(),
        inscripcion.isRequiereFactura(),
        inscripcion.getCertificadoUrl(),
        inscripcion.getUsuario() != null ? inscripcion.getUsuario().getId() : null,
        inscripcion.getUsuario() != null ? inscripcion.getUsuario().getNombre() : null,
        inscripcion.getUsuario() != null ? inscripcion.getUsuario().getApellido() : null,
        inscripcion.getUsuario() != null ? inscripcion.getUsuario().getEmail() : null,
        pago != null ? pago.getId() : null,
        pago != null ? pago.getMonto() : null,
        pago != null && pago.getEstado() != null ? pago.getEstado().name() : null,
        pago != null && pago.getMetodo() != null ? pago.getMetodo().name() : null,
        pago != null ? pago.getComprobanteUrl() : null);
  }
}
