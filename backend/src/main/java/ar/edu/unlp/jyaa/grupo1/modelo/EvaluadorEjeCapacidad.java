package ar.edu.unlp.jyaa.grupo1.modelo;

import jakarta.persistence.*;
import java.io.Serializable;

/**
 * Cupo de evaluaciones que un evaluador puede recibir por eje temático.
 * {@code restantes} baja al asignar un trabajo y se puede reiniciar a {@code capacidadMax}.
 */
@Entity
@Table(
    name = "evaluador_eje_capacidad",
    uniqueConstraints =
        @UniqueConstraint(
            name = "uk_evaluador_eje",
            columnNames = {"usuario_id", "eje_tematico"}))
public class EvaluadorEjeCapacidad implements Serializable {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "usuario_id", nullable = false)
  private Usuario usuario;

  @Column(name = "eje_tematico", nullable = false, length = 300)
  private String ejeTematico;

  @Column(name = "capacidad_max", nullable = false)
  private int capacidadMax;

  @Column(nullable = false)
  private int restantes;

  @Column(nullable = false)
  private boolean activo = true;

  public EvaluadorEjeCapacidad() {}

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public Usuario getUsuario() {
    return usuario;
  }

  public void setUsuario(Usuario usuario) {
    this.usuario = usuario;
  }

  public String getEjeTematico() {
    return ejeTematico;
  }

  public void setEjeTematico(String ejeTematico) {
    this.ejeTematico = ejeTematico;
  }

  public int getCapacidadMax() {
    return capacidadMax;
  }

  public void setCapacidadMax(int capacidadMax) {
    this.capacidadMax = capacidadMax;
  }

  public int getRestantes() {
    return restantes;
  }

  public void setRestantes(int restantes) {
    this.restantes = restantes;
  }

  public boolean isActivo() {
    return activo;
  }

  public void setActivo(boolean activo) {
    this.activo = activo;
  }
}
