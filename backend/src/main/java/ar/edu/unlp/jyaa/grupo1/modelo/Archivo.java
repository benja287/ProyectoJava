package ar.edu.unlp.jyaa.grupo1.modelo;

import jakarta.persistence.*;
import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * Tabla separada para PDFs y comprobantes. Los bytes van en {@link #contenido} (BLOB); las
 * entidades {@link Trabajo} y {@link Pago} solo guardan la URL de descarga ({@code documentoUrl},
 * {@code comprobanteUrl}).
 */
@Entity
@Table(name = "archivos")
public class Archivo implements Serializable {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "nombre_original", nullable = false, length = 255)
  private String nombreOriginal;

  @Column(name = "content_type", nullable = false, length = 100)
  private String contentType;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  private TipoArchivoAlmacenado tipo;

  @Lob
  @Basic(fetch = FetchType.LAZY)
  @Column(name = "contenido", nullable = false)
  private byte[] contenido;

  @Column(name = "fecha_subida", nullable = false)
  private LocalDateTime fechaSubida;

  public Archivo() {}

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public String getNombreOriginal() {
    return nombreOriginal;
  }

  public void setNombreOriginal(String nombreOriginal) {
    this.nombreOriginal = nombreOriginal;
  }

  public String getContentType() {
    return contentType;
  }

  public void setContentType(String contentType) {
    this.contentType = contentType;
  }

  public TipoArchivoAlmacenado getTipo() {
    return tipo;
  }

  public void setTipo(TipoArchivoAlmacenado tipo) {
    this.tipo = tipo;
  }

  public byte[] getContenido() {
    return contenido;
  }

  public void setContenido(byte[] contenido) {
    this.contenido = contenido;
  }

  public LocalDateTime getFechaSubida() {
    return fechaSubida;
  }

  public void setFechaSubida(LocalDateTime fechaSubida) {
    this.fechaSubida = fechaSubida;
  }
}
