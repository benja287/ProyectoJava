package ar.unlp.agroecologia.modelo;

import java.time.LocalDateTime;
import java.util.Objects;
import java.util.UUID;

public class AsignacionEvaluacion {
    private final UUID id;
    private final Trabajo trabajo;
    private final Usuario evaluador;
    private boolean aceptada;
    private LocalDateTime fechaRespuesta;

    public AsignacionEvaluacion(Trabajo trabajo, Usuario evaluador) {
        this.id = UUID.randomUUID();
        this.trabajo = Objects.requireNonNull(trabajo);
        this.evaluador = Objects.requireNonNull(evaluador);
        this.aceptada = false;
    }

    public UUID getId() {
        return id;
    }

    public Trabajo getTrabajo() {
        return trabajo;
    }

    public Usuario getEvaluador() {
        return evaluador;
    }

    public boolean isAceptada() {
        return aceptada;
    }

    public LocalDateTime getFechaRespuesta() {
        return fechaRespuesta;
    }

    public void aceptar() {
        this.aceptada = true;
        this.fechaRespuesta = LocalDateTime.now();
    }

    public void rechazar() {
        this.aceptada = false;
        this.fechaRespuesta = LocalDateTime.now();
    }
}
