package ar.edu.unlp.jyaa.grupo1.web.dto;

import ar.edu.unlp.jyaa.grupo1.modelo.EstadoInscripcion;
import ar.edu.unlp.jyaa.grupo1.modelo.InscripcionCongreso;
import ar.edu.unlp.jyaa.grupo1.modelo.Pago;
import ar.edu.unlp.jyaa.grupo1.modelo.Usuario;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record InscripcionCongresoDTO(
    Long id,
    String categoria,
    EstadoInscripcion estado,
    LocalDate fechaSolicitud,
    String motivoRechazo,
    String institucion,
    String provincia,
    boolean requiereFactura,
    String facturaRazonSocial,
    String facturaCuit,
    String facturaCondicionIva,
    String facturaDomicilioFiscal,
    List<String> tiposParticipacion,
    String participacionOtro,
    String certificadoUrl,
    Long usuarioId,
    String usuarioNombre,
    String usuarioApellido,
    String usuarioEmail,
    String usuarioTelefono,
    String usuarioTipoIdentificacion,
    String usuarioNumeroIdentificacion,
    String usuarioNacionalidad,
    Long pagoId,
    Double pagoMonto,
    String pagoEstado,
    String pagoMetodo,
    String pagoComprobanteUrl,
    String pagoFacturaUrl,
    String pagoNumeroRecibo,
    LocalDateTime pagoFechaValidacion,
    String pagoValidadoPorNombre,
    String pagoObservacionesValidacion,
    Boolean pagoEfectivoFisicoRecibido) {

  public static InscripcionCongresoDTO from(InscripcionCongreso inscripcion) {
    Pago pago = inscripcion.getPago();
    Usuario u = inscripcion.getUsuario();
    String validadoPorNombre = null;
    if (pago != null && pago.getValidadoPor() != null) {
      validadoPorNombre =
          (pago.getValidadoPor().getNombre() + " " + pago.getValidadoPor().getApellido()).trim();
    }
    return new InscripcionCongresoDTO(
        inscripcion.getId(),
        inscripcion.getCategoria(),
        inscripcion.getEstado(),
        inscripcion.getFechaSolicitud(),
        inscripcion.getMotivoRechazo(),
        inscripcion.getInstitucion(),
        inscripcion.getProvincia(),
        inscripcion.isRequiereFactura(),
        inscripcion.getFacturaRazonSocial(),
        inscripcion.getFacturaCuit(),
        inscripcion.getFacturaCondicionIva(),
        inscripcion.getFacturaDomicilioFiscal(),
        inscripcion.getTiposParticipacion() != null
            ? List.copyOf(inscripcion.getTiposParticipacion())
            : List.of(),
        inscripcion.getParticipacionOtro(),
        inscripcion.getCertificadoUrl(),
        u != null ? u.getId() : null,
        u != null ? u.getNombre() : null,
        u != null ? u.getApellido() : null,
        u != null ? u.getEmail() : null,
        u != null ? u.getTelefono() : null,
        u != null ? u.getTipoIdentificacion() : null,
        u != null ? u.getNumeroIdentificacion() : null,
        u != null ? u.getNacionalidad() : null,
        pago != null ? pago.getId() : null,
        pago != null ? pago.getMonto() : null,
        pago != null && pago.getEstado() != null ? pago.getEstado().name() : null,
        pago != null && pago.getMetodo() != null ? pago.getMetodo().name() : null,
        pago != null ? pago.getComprobanteUrl() : null,
        pago != null ? pago.getFacturaUrl() : null,
        pago != null ? pago.getNumeroRecibo() : null,
        pago != null ? pago.getFechaValidacion() : null,
        validadoPorNombre,
        pago != null ? pago.getObservacionesValidacion() : null,
        pago != null ? pago.isEfectivoFisicoRecibido() : null);
  }
}
