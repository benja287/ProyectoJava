package ar.unlp.agroecologia.modelo;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

public class Trabajo {
    private final UUID id;
    private final Usuario autorPrincipal;
    private final List<String> coautores;
    private String titulo;
    private String resumen;
    private String ejeTematico;
    private TipoTrabajo tipo;
    private EstadoTrabajo estado;
    private String documentoUrl;
    private final LocalDateTime fechaCreacion;
    private final List<Evaluacion> evaluaciones;

    public Trabajo(Usuario autorPrincipal, String titulo, String resumen, String ejeTematico, TipoTrabajo tipo, String documentoUrl) {
        this.id = UUID.randomUUID();
        this.autorPrincipal = Objects.requireNonNull(autorPrincipal);
        this.titulo = Objects.requireNonNull(titulo);
        this.resumen = Objects.requireNonNull(resumen);
        this.ejeTematico = Objects.requireNonNull(ejeTematico);
        this.tipo = Objects.requireNonNull(tipo);
        this.documentoUrl = Objects.requireNonNull(documentoUrl);
        this.estado = EstadoTrabajo.BORRADOR;
        this.fechaCreacion = LocalDateTime.now();
        this.evaluaciones = new ArrayList<>();
        this.coautores = new ArrayList<>();
    }

    public UUID getId() {
        return id;
    }

    public Usuario getAutorPrincipal() {
        return autorPrincipal;
    }

    public String getTitulo() {
        return titulo;
    }

    public String getEjeTematico() {
        return ejeTematico;
    }

    public TipoTrabajo getTipo() {
        return tipo;
    }

    public EstadoTrabajo getEstado() {
        return estado;
    }

    public LocalDateTime getFechaCreacion() {
        return fechaCreacion;
    }

    public List<Evaluacion> getEvaluaciones() {
        return Collections.unmodifiableList(evaluaciones);
    }

    public List<String> getCoautores() {
        return Collections.unmodifiableList(coautores);
    }

    public void agregarCoautor(String nombreCompleto) {
        this.coautores.add(Objects.requireNonNull(nombreCompleto));
    }

    public void enviar() {
        if (estado != EstadoTrabajo.BORRADOR) {
            throw new IllegalStateException("Solo se puede enviar desde BORRADOR");
        }
        this.estado = EstadoTrabajo.ENVIADO;
    }

    public void pasarAEvaluacion() {
        if (estado != EstadoTrabajo.ENVIADO && estado != EstadoTrabajo.APROBADO_CON_CORRECCIONES) {
            throw new IllegalStateException("Estado invalido para iniciar evaluacion");
        }
        this.estado = EstadoTrabajo.EN_EVALUACION;
    }

    public void registrarEvaluacion(Evaluacion evaluacion) {
        this.evaluaciones.add(Objects.requireNonNull(evaluacion));
    }

    public void aplicarDecisionFinal(RecomendacionEvaluacion recomendacion) {
        if (recomendacion == RecomendacionEvaluacion.APROBADO) {
            this.estado = EstadoTrabajo.APROBADO;
        } else if (recomendacion == RecomendacionEvaluacion.APROBADO_CON_CORRECCIONES) {
            this.estado = EstadoTrabajo.APROBADO_CON_CORRECCIONES;
        } else {
            this.estado = EstadoTrabajo.RECHAZADO;
        }
    }

    public void notificarDecision() {
        if (estado == EstadoTrabajo.APROBADO || estado == EstadoTrabajo.RECHAZADO || estado == EstadoTrabajo.APROBADO_CON_CORRECCIONES) {
            this.estado = EstadoTrabajo.NOTIFICADO;
            return;
        }
        throw new IllegalStateException("No se puede notificar un trabajo sin decision");
    }
}
