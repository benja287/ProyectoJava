package ar.edu.unlp.jyaa.grupo1.modelo;

import jakarta.persistence.*;
import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "actividades")
public class Actividad implements Serializable {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, length = 300)
  private String titulo;

  @Column(length = 120)
  private String sala;

  private LocalDateTime inicio;
  private LocalDateTime fin;

  @Enumerated(EnumType.STRING)
  @Column(name = "tipo_actividad", nullable = false)
  private TipoActividad tipoActividad;

  @Column(length = 40)
  private String codigo;

  @ManyToMany
  @JoinTable(
      name = "actividad_trabajos",
      joinColumns = @JoinColumn(name = "actividad_id"),
      inverseJoinColumns = @JoinColumn(name = "trabajo_id"))
  private List<Trabajo> trabajos = new ArrayList<>();

  public Actividad() {}

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public String getTitulo() {
    return titulo;
  }

  public void setTitulo(String titulo) {
    this.titulo = titulo;
  }

  public String getSala() {
    return sala;
  }

  public void setSala(String sala) {
    this.sala = sala;
  }

  public LocalDateTime getInicio() {
    return inicio;
  }

  public void setInicio(LocalDateTime inicio) {
    this.inicio = inicio;
  }

  public LocalDateTime getFin() {
    return fin;
  }

  public void setFin(LocalDateTime fin) {
    this.fin = fin;
  }

  public TipoActividad getTipoActividad() {
    return tipoActividad;
  }

  public void setTipoActividad(TipoActividad tipoActividad) {
    this.tipoActividad = tipoActividad;
  }

  public String getCodigo() {
    return codigo;
  }

  public void setCodigo(String codigo) {
    this.codigo = codigo;
  }

  public List<Trabajo> getTrabajos() {
    return trabajos;
  }

  public void setTrabajos(List<Trabajo> trabajos) {
    this.trabajos = trabajos;
  }
}
