package ar.edu.unlp.jyaa.grupo1.modelo;

import jakarta.persistence.*;
import java.io.Serializable;
import java.time.LocalDate;

@Entity
@Table(name = "inscripciones_congreso")
public class InscripcionCongreso implements Serializable {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, length = 80)
  private String categoria;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private EstadoInscripcion estado = EstadoInscripcion.PENDIENTE;

  @Column(name = "fecha_solicitud")
  private LocalDate fechaSolicitud;

  @Column(name = "motivo_rechazo", length = 500)
  private String motivoRechazo;

  @Column(length = 200)
  private String institucion;

  @Column(length = 120)
  private String provincia;

  @Column(name = "requiere_factura", nullable = false)
  private boolean requiereFactura;

  @Column(name = "certificado_url", length = 500)
  private String certificadoUrl;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "usuario_id", nullable = false)
  private Usuario usuario;

  @OneToOne(cascade = CascadeType.ALL, orphanRemoval = true)
  @JoinColumn(name = "pago_id")
  private Pago pago;

  public InscripcionCongreso() {}

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public String getCategoria() {
    return categoria;
  }

  public void setCategoria(String categoria) {
    this.categoria = categoria;
  }

  public EstadoInscripcion getEstado() {
    return estado;
  }

  public void setEstado(EstadoInscripcion estado) {
    this.estado = estado;
  }

  public LocalDate getFechaSolicitud() {
    return fechaSolicitud;
  }

  public void setFechaSolicitud(LocalDate fechaSolicitud) {
    this.fechaSolicitud = fechaSolicitud;
  }

  public String getMotivoRechazo() {
    return motivoRechazo;
  }

  public void setMotivoRechazo(String motivoRechazo) {
    this.motivoRechazo = motivoRechazo;
  }

  public String getInstitucion() {
    return institucion;
  }

  public void setInstitucion(String institucion) {
    this.institucion = institucion;
  }

  public String getProvincia() {
    return provincia;
  }

  public void setProvincia(String provincia) {
    this.provincia = provincia;
  }

  public boolean isRequiereFactura() {
    return requiereFactura;
  }

  public void setRequiereFactura(boolean requiereFactura) {
    this.requiereFactura = requiereFactura;
  }

  public String getCertificadoUrl() {
    return certificadoUrl;
  }

  public void setCertificadoUrl(String certificadoUrl) {
    this.certificadoUrl = certificadoUrl;
  }

  public Usuario getUsuario() {
    return usuario;
  }

  public void setUsuario(Usuario usuario) {
    this.usuario = usuario;
  }

  public Pago getPago() {
    return pago;
  }

  public void setPago(Pago pago) {
    this.pago = pago;
  }
}
