package ar.edu.unlp.jyaa.grupo1.modelo;

import jakarta.persistence.*;
import java.io.Serializable;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

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

  @Column(name = "factura_razon_social", length = 200)
  private String facturaRazonSocial;

  @Column(name = "factura_cuit", length = 20)
  private String facturaCuit;

  @Column(name = "factura_condicion_iva", length = 80)
  private String facturaCondicionIva;

  @Column(name = "factura_domicilio_fiscal", length = 300)
  private String facturaDomicilioFiscal;

  @ElementCollection(fetch = FetchType.EAGER)
  @CollectionTable(
      name = "inscripcion_tipos_participacion",
      joinColumns = @JoinColumn(name = "inscripcion_id"))
  @Column(name = "tipo", length = 40)
  private List<String> tiposParticipacion = new ArrayList<>();

  @Column(name = "participacion_otro", length = 300)
  private String participacionOtro;

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

  public String getFacturaRazonSocial() {
    return facturaRazonSocial;
  }

  public void setFacturaRazonSocial(String facturaRazonSocial) {
    this.facturaRazonSocial = facturaRazonSocial;
  }

  public String getFacturaCuit() {
    return facturaCuit;
  }

  public void setFacturaCuit(String facturaCuit) {
    this.facturaCuit = facturaCuit;
  }

  public String getFacturaCondicionIva() {
    return facturaCondicionIva;
  }

  public void setFacturaCondicionIva(String facturaCondicionIva) {
    this.facturaCondicionIva = facturaCondicionIva;
  }

  public String getFacturaDomicilioFiscal() {
    return facturaDomicilioFiscal;
  }

  public void setFacturaDomicilioFiscal(String facturaDomicilioFiscal) {
    this.facturaDomicilioFiscal = facturaDomicilioFiscal;
  }

  public List<String> getTiposParticipacion() {
    return tiposParticipacion;
  }

  public void setTiposParticipacion(List<String> tiposParticipacion) {
    this.tiposParticipacion = tiposParticipacion != null ? tiposParticipacion : new ArrayList<>();
  }

  public String getParticipacionOtro() {
    return participacionOtro;
  }

  public void setParticipacionOtro(String participacionOtro) {
    this.participacionOtro = participacionOtro;
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
