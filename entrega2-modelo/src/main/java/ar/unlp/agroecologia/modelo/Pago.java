package ar.unlp.agroecologia.modelo;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Objects;
import java.util.UUID;

public class Pago {
    private final UUID id;
    private final Usuario participante;
    private final BigDecimal monto;
    private final MetodoPago metodo;
    private final boolean requiereFactura;
    private final String comprobanteUrl;
    private EstadoPago estado;
    private String motivoRechazo;
    private String qrAcreditacion;
    private final LocalDateTime fechaRegistro;

    public Pago(Usuario participante, BigDecimal monto, MetodoPago metodo, boolean requiereFactura, String comprobanteUrl) {
        this.id = UUID.randomUUID();
        this.participante = Objects.requireNonNull(participante);
        this.monto = Objects.requireNonNull(monto);
        this.metodo = Objects.requireNonNull(metodo);
        this.requiereFactura = requiereFactura;
        this.comprobanteUrl = comprobanteUrl;
        this.estado = EstadoPago.PENDIENTE;
        this.fechaRegistro = LocalDateTime.now();
    }

    public UUID getId() {
        return id;
    }

    public EstadoPago getEstado() {
        return estado;
    }

    public String getQrAcreditacion() {
        return qrAcreditacion;
    }

    public void aprobar(String qrAcreditacion) {
        this.estado = EstadoPago.APROBADO;
        this.qrAcreditacion = Objects.requireNonNull(qrAcreditacion);
        this.motivoRechazo = null;
    }

    public void rechazar(String motivoRechazo) {
        this.estado = EstadoPago.RECHAZADO;
        this.motivoRechazo = Objects.requireNonNull(motivoRechazo);
        this.qrAcreditacion = null;
    }

    public void reintentar() {
        if (estado != EstadoPago.RECHAZADO) {
            throw new IllegalStateException("Solo se puede reintentar un pago rechazado");
        }
        this.estado = EstadoPago.PENDIENTE;
        this.motivoRechazo = null;
    }
}
