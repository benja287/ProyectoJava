package ar.edu.unlp.jyaa.grupo1.modelo;

import jakarta.persistence.*;
import java.io.Serializable;

@Entity
@Table(name = "solicitud_evaluador_capacidad")
public class SolicitudEvaluadorCapacidad implements Serializable {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "solicitud_id", nullable = false)
  private SolicitudEvaluador solicitud;

  @Column(name = "eje_tematico", nullable = false, length = 300)
  private String ejeTematico;

  @Column(nullable = false)
  private int capacidad;

  public SolicitudEvaluadorCapacidad() {}

  public Long getId() { return id; }
  public void setId(Long id) { this.id = id; }
  public SolicitudEvaluador getSolicitud() { return solicitud; }
  public void setSolicitud(SolicitudEvaluador solicitud) { this.solicitud = solicitud; }
  public String getEjeTematico() { return ejeTematico; }
  public void setEjeTematico(String ejeTematico) { this.ejeTematico = ejeTematico; }
  public int getCapacidad() { return capacidad; }
  public void setCapacidad(int capacidad) { this.capacidad = capacidad; }
}
