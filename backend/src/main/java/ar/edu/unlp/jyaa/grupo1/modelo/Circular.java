package ar.edu.unlp.jyaa.grupo1.modelo;

import jakarta.persistence.*;
import java.io.Serializable;
import java.time.LocalDate;

@Entity
@Table(name = "circulares")
public class Circular implements Serializable {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, length = 200)
  private String titulo;

  @Column(nullable = false, columnDefinition = "TEXT")
  private String contenido;

  @Column(columnDefinition = "TEXT")
  private String resumen;

  @Column(name = "documento_url", length = 500)
  private String documentoUrl;

  @Column(name = "documento_nombre", length = 255)
  private String documentoNombre;

  @Column(nullable = false)
  private boolean publicada;

  @Column(name = "fecha_publicacion")
  private LocalDate fechaPublicacion;

  public Circular() {}

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

  public String getContenido() {
    return contenido;
  }

  public void setContenido(String contenido) {
    this.contenido = contenido;
  }

  public String getResumen() {
    return resumen;
  }

  public void setResumen(String resumen) {
    this.resumen = resumen;
  }

  public String getDocumentoUrl() {
    return documentoUrl;
  }

  public void setDocumentoUrl(String documentoUrl) {
    this.documentoUrl = documentoUrl;
  }

  public String getDocumentoNombre() {
    return documentoNombre;
  }

  public void setDocumentoNombre(String documentoNombre) {
    this.documentoNombre = documentoNombre;
  }

  public boolean isPublicada() {
    return publicada;
  }

  public void setPublicada(boolean publicada) {
    this.publicada = publicada;
  }

  public LocalDate getFechaPublicacion() {
    return fechaPublicacion;
  }

  public void setFechaPublicacion(LocalDate fechaPublicacion) {
    this.fechaPublicacion = fechaPublicacion;
  }
}
