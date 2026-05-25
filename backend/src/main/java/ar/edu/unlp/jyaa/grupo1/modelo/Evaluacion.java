package ar.edu.unlp.jyaa.grupo1.modelo;

import jakarta.persistence.*;
import java.io.Serializable;
import java.time.LocalDate;

@Entity
@Table(name = "evaluaciones")
public class Evaluacion implements Serializable {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private RecomendacionEvaluacion recomendacion;

  @Column(columnDefinition = "TEXT")
  private String comentario;

  private LocalDate fecha;

  @OneToOne(optional = false)
  @JoinColumn(name = "asignacion_id", nullable = false, unique = true)
  private AsignacionEvaluacion asignacion;

  public Evaluacion() {}

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public RecomendacionEvaluacion getRecomendacion() {
    return recomendacion;
  }

  public void setRecomendacion(RecomendacionEvaluacion recomendacion) {
    this.recomendacion = recomendacion;
  }

  public String getComentario() {
    return comentario;
  }

  public void setComentario(String comentario) {
    this.comentario = comentario;
  }

  public LocalDate getFecha() {
    return fecha;
  }

  public void setFecha(LocalDate fecha) {
    this.fecha = fecha;
  }

  public AsignacionEvaluacion getAsignacion() {
    return asignacion;
  }

  public void setAsignacion(AsignacionEvaluacion asignacion) {
    this.asignacion = asignacion;
  }
}
