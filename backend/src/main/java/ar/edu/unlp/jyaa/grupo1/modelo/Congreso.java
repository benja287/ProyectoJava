package ar.edu.unlp.jyaa.grupo1.modelo;

import jakarta.persistence.*;
import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "congresos")
public class Congreso implements Serializable {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, length = 200)
  private String nombre;

  @Column(nullable = false, length = 80)
  private String edicion;

  @ElementCollection
  @CollectionTable(name = "congreso_etapas", joinColumns = @JoinColumn(name = "congreso_id"))
  private List<EtapaCongreso> etapas = new ArrayList<>();

  public Congreso() {}

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public String getNombre() {
    return nombre;
  }

  public void setNombre(String nombre) {
    this.nombre = nombre;
  }

  public String getEdicion() {
    return edicion;
  }

  public void setEdicion(String edicion) {
    this.edicion = edicion;
  }

  public List<EtapaCongreso> getEtapas() {
    return etapas;
  }

  public void setEtapas(List<EtapaCongreso> etapas) {
    this.etapas = etapas;
  }
}
