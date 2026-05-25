package ar.edu.unlp.jyaa.grupo1.modelo;

import jakarta.persistence.*;
import java.io.Serializable;
import java.time.LocalDate;

@Entity
@Table(name = "asignaciones_evaluacion")
public class AsignacionEvaluacion implements Serializable {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false)
  private boolean aceptada;

  @Column(name = "fecha_respuesta")
  private LocalDate fechaRespuesta;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "trabajo_id", nullable = false)
  private Trabajo trabajo;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "evaluador_id", nullable = false)
  private Usuario evaluador;

  @OneToOne(mappedBy = "asignacion", cascade = CascadeType.ALL, orphanRemoval = true)
  private Evaluacion evaluacion;

  public AsignacionEvaluacion() {}

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public boolean isAceptada() {
    return aceptada;
  }

  public void setAceptada(boolean aceptada) {
    this.aceptada = aceptada;
  }

  public LocalDate getFechaRespuesta() {
    return fechaRespuesta;
  }

  public void setFechaRespuesta(LocalDate fechaRespuesta) {
    this.fechaRespuesta = fechaRespuesta;
  }

  public Trabajo getTrabajo() {
    return trabajo;
  }

  public void setTrabajo(Trabajo trabajo) {
    this.trabajo = trabajo;
  }

  public Usuario getEvaluador() {
    return evaluador;
  }

  public void setEvaluador(Usuario evaluador) {
    this.evaluador = evaluador;
  }

  public Evaluacion getEvaluacion() {
    return evaluacion;
  }

  public void setEvaluacion(Evaluacion evaluacion) {
    this.evaluacion = evaluacion;
  }
}
