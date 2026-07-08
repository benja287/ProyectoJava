package ar.edu.unlp.jyaa.grupo1.modelo;

import jakarta.persistence.*;
import java.io.Serializable;

@Entity
@Table(name = "congresos_anteriores")
public class CongresoAnterior implements Serializable {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, unique = true)
  private int anio;

  @Column(nullable = false, length = 200)
  private String titulo;

  @Column(nullable = false, length = 200)
  private String ubicacion;

  @Column(name = "fecha_etiqueta", nullable = false, length = 80)
  private String fechaEtiqueta;

  @Column(nullable = false, columnDefinition = "TEXT")
  private String destacado;

  @Column(name = "url_sitio", nullable = false, length = 500)
  private String urlSitio;

  @Column(name = "url_memorias", length = 500)
  private String urlMemorias;

  @Column(name = "orden", nullable = false)
  private int orden;

  public CongresoAnterior() {}

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public int getAnio() {
    return anio;
  }

  public void setAnio(int anio) {
    this.anio = anio;
  }

  public String getTitulo() {
    return titulo;
  }

  public void setTitulo(String titulo) {
    this.titulo = titulo;
  }

  public String getUbicacion() {
    return ubicacion;
  }

  public void setUbicacion(String ubicacion) {
    this.ubicacion = ubicacion;
  }

  public String getFechaEtiqueta() {
    return fechaEtiqueta;
  }

  public void setFechaEtiqueta(String fechaEtiqueta) {
    this.fechaEtiqueta = fechaEtiqueta;
  }

  public String getDestacado() {
    return destacado;
  }

  public void setDestacado(String destacado) {
    this.destacado = destacado;
  }

  public String getUrlSitio() {
    return urlSitio;
  }

  public void setUrlSitio(String urlSitio) {
    this.urlSitio = urlSitio;
  }

  public String getUrlMemorias() {
    return urlMemorias;
  }

  public void setUrlMemorias(String urlMemorias) {
    this.urlMemorias = urlMemorias;
  }

  public int getOrden() {
    return orden;
  }

  public void setOrden(int orden) {
    this.orden = orden;
  }
}
