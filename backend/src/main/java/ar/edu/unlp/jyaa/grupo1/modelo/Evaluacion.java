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

  /** Comentario visible para autorxs (campo histórico). */
  @Column(columnDefinition = "TEXT")
  private String comentario;

  /** Comentario interno solo para la comisión científica. */
  @Column(name = "comentario_comite", columnDefinition = "TEXT")
  private String comentarioComite;

  @Enumerated(EnumType.STRING)
  @Column(name = "modalidad_recomendada", length = 30)
  private ModalidadRecomendadaEvaluacion modalidadRecomendada;

  /** Rúbrica Sí/No + sugerencias (JSON). */
  @Column(name = "rubrica_json", columnDefinition = "TEXT")
  private String rubricaJson;

  @Column(name = "archivo_correccion_url", length = 500)
  private String archivoCorreccionUrl;

  @Column(name = "archivo_correccion_nombre", length = 255)
  private String archivoCorreccionNombre;

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

  public String getComentarioComite() {
    return comentarioComite;
  }

  public void setComentarioComite(String comentarioComite) {
    this.comentarioComite = comentarioComite;
  }

  public ModalidadRecomendadaEvaluacion getModalidadRecomendada() {
    return modalidadRecomendada;
  }

  public void setModalidadRecomendada(ModalidadRecomendadaEvaluacion modalidadRecomendada) {
    this.modalidadRecomendada = modalidadRecomendada;
  }

  public String getRubricaJson() {
    return rubricaJson;
  }

  public void setRubricaJson(String rubricaJson) {
    this.rubricaJson = rubricaJson;
  }

  public String getArchivoCorreccionUrl() {
    return archivoCorreccionUrl;
  }

  public void setArchivoCorreccionUrl(String archivoCorreccionUrl) {
    this.archivoCorreccionUrl = archivoCorreccionUrl;
  }

  public String getArchivoCorreccionNombre() {
    return archivoCorreccionNombre;
  }

  public void setArchivoCorreccionNombre(String archivoCorreccionNombre) {
    this.archivoCorreccionNombre = archivoCorreccionNombre;
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
