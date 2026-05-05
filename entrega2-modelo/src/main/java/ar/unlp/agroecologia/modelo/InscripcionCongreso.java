package ar.unlp.agroecologia.modelo;

import java.time.LocalDateTime;
import java.util.Objects;
import java.util.UUID;

public class InscripcionCongreso {
    private final UUID id;
    private final Usuario participante;
    private String categoria;
    private EstadoInscripcion estado;
    private final LocalDateTime fechaSolicitud;
    private String motivoRechazo;
    private Pago pago;

    public InscripcionCongreso(Usuario participante, String categoria) {
        this.id = UUID.randomUUID();
        this.participante = Objects.requireNonNull(participante);
        this.categoria = Objects.requireNonNull(categoria);
        this.estado = EstadoInscripcion.PENDIENTE;
        this.fechaSolicitud = LocalDateTime.now();
    }

    public UUID getId() {
        return id;
    }

    public EstadoInscripcion getEstado() {
        return estado;
    }

    public void asociarPago(Pago pago) {
        this.pago = Objects.requireNonNull(pago);
    }

    public void confirmar() {
        if (pago == null || pago.getEstado() != EstadoPago.APROBADO) {
            throw new IllegalStateException("No se puede confirmar sin pago aprobado");
        }
        this.estado = EstadoInscripcion.CONFIRMADA;
        this.motivoRechazo = null;
        this.participante.agregarRol(Rol.PARTICIPANTE);
    }

    public void rechazar(String motivo) {
        this.estado = EstadoInscripcion.RECHAZADA;
        this.motivoRechazo = Objects.requireNonNull(motivo);
    }
}
