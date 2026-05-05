package ar.unlp.agroecologia.modelo;

import java.time.LocalDateTime;
import java.util.Objects;
import java.util.UUID;

public class Evaluacion {
    private final UUID id;
    private final Usuario evaluador;
    private final RecomendacionEvaluacion recomendacion;
    private final String comentario;
    private final LocalDateTime fecha;

    public Evaluacion(Usuario evaluador, RecomendacionEvaluacion recomendacion, String comentario) {
        this.id = UUID.randomUUID();
        this.evaluador = Objects.requireNonNull(evaluador);
        this.recomendacion = Objects.requireNonNull(recomendacion);
        this.comentario = comentario == null ? "" : comentario;
        this.fecha = LocalDateTime.now();
    }

    public UUID getId() {
        return id;
    }

    public Usuario getEvaluador() {
        return evaluador;
    }

    public RecomendacionEvaluacion getRecomendacion() {
        return recomendacion;
    }

    public String getComentario() {
        return comentario;
    }

    public LocalDateTime getFecha() {
        return fecha;
    }
}
