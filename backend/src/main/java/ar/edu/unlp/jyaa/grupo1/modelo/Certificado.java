package ar.edu.unlp.jyaa.grupo1.modelo;

import jakarta.persistence.*;
import java.io.Serializable;
import java.time.LocalDate;

@Entity
@Table(name = "certificados")
public class Certificado implements Serializable {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "archivo_url", length = 500)
  private String archivoUrl;

  @Column(name = "fecha_emision")
  private LocalDate fechaEmision;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "usuario_id", nullable = false)
  private Usuario usuario;

  public Certificado() {}

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public String getArchivoUrl() {
    return archivoUrl;
  }

  public void setArchivoUrl(String archivoUrl) {
    this.archivoUrl = archivoUrl;
  }

  public LocalDate getFechaEmision() {
    return fechaEmision;
  }

  public void setFechaEmision(LocalDate fechaEmision) {
    this.fechaEmision = fechaEmision;
  }

  public Usuario getUsuario() {
    return usuario;
  }

  public void setUsuario(Usuario usuario) {
    this.usuario = usuario;
  }
}
