package ar.edu.unlp.jyaa.grupo1.modelo;

import jakarta.persistence.*;
import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "cronogramas_personales")
public class CronogramaPersonal implements Serializable {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @OneToOne(optional = false)
  @JoinColumn(name = "usuario_id", nullable = false, unique = true)
  private Usuario usuario;

  @ManyToMany
  @JoinTable(
      name = "cronograma_actividades",
      joinColumns = @JoinColumn(name = "cronograma_id"),
      inverseJoinColumns = @JoinColumn(name = "actividad_id"))
  private List<Actividad> actividades = new ArrayList<>();

  public CronogramaPersonal() {}

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

  public List<Actividad> getActividades() {
    return actividades;
  }

  public void setActividades(List<Actividad> actividades) {
    this.actividades = actividades;
  }
}
