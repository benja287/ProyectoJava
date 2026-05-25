package ar.edu.unlp.jyaa.grupo1.modelo;

import jakarta.persistence.*;
import java.io.Serializable;

@Entity
@Table(name = "plantillas_email")
public class PlantillaEmail implements Serializable {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, length = 120)
  private String nombre;

  @Column(nullable = false, length = 300)
  private String asunto;

  @Column(nullable = false, columnDefinition = "TEXT")
  private String cuerpo;

  public PlantillaEmail() {}

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

  public String getAsunto() {
    return asunto;
  }

  public void setAsunto(String asunto) {
    this.asunto = asunto;
  }

  public String getCuerpo() {
    return cuerpo;
  }

  public void setCuerpo(String cuerpo) {
    this.cuerpo = cuerpo;
  }
}
