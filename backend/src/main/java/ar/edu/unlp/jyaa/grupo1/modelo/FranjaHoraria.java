package ar.edu.unlp.jyaa.grupo1.modelo;

import jakarta.persistence.*;
import java.io.Serializable;
import java.time.LocalTime;

/** Franja horaria configurable por día lógico del congreso (1..3). */
@Entity
@Table(name = "franjas_horarias")
public class FranjaHoraria implements Serializable {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  /** Día lógico del evento (1 = inicio del congreso). */
  @Column(name = "dia_congreso", nullable = false)
  private int diaCongreso;

  @Column(length = 120)
  private String etiqueta;

  @Column(name = "hora_inicio", nullable = false)
  private LocalTime horaInicio;

  @Column(name = "hora_fin", nullable = false)
  private LocalTime horaFin;

  @Column(nullable = false)
  private boolean activa = true;

  public FranjaHoraria() {}

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public int getDiaCongreso() {
    return diaCongreso;
  }

  public void setDiaCongreso(int diaCongreso) {
    this.diaCongreso = diaCongreso;
  }

  public String getEtiqueta() {
    return etiqueta;
  }

  public void setEtiqueta(String etiqueta) {
    this.etiqueta = etiqueta;
  }

  public LocalTime getHoraInicio() {
    return horaInicio;
  }

  public void setHoraInicio(LocalTime horaInicio) {
    this.horaInicio = horaInicio;
  }

  public LocalTime getHoraFin() {
    return horaFin;
  }

  public void setHoraFin(LocalTime horaFin) {
    this.horaFin = horaFin;
  }

  public boolean isActiva() {
    return activa;
  }

  public void setActiva(boolean activa) {
    this.activa = activa;
  }
}
