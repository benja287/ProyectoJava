package ar.edu.unlp.jyaa.grupo1.modelo;

import jakarta.persistence.*;
import java.io.Serializable;
import java.time.LocalDate;

@Entity
@Table(name = "pagos")
public class Pago implements Serializable {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  private double monto;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private MetodoPago metodo;

  @Column(name = "requiere_factura", nullable = false)
  private boolean requiereFactura;

  @Column(name = "comprobante_url", length = 500)
  private String comprobanteUrl;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private EstadoPago estado = EstadoPago.PENDIENTE;

  @Column(name = "motivo_rechazo", length = 500)
  private String motivoRechazo;

  @Column(name = "id_asociacion", length = 120)
  private String idAsociacion;

  @Column(name = "fecha_registro")
  private LocalDate fechaRegistro;

  public Pago() {}

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public double getMonto() {
    return monto;
  }

  public void setMonto(double monto) {
    this.monto = monto;
  }

  public MetodoPago getMetodo() {
    return metodo;
  }

  public void setMetodo(MetodoPago metodo) {
    this.metodo = metodo;
  }

  public boolean isRequiereFactura() {
    return requiereFactura;
  }

  public void setRequiereFactura(boolean requiereFactura) {
    this.requiereFactura = requiereFactura;
  }

  public String getComprobanteUrl() {
    return comprobanteUrl;
  }

  public void setComprobanteUrl(String comprobanteUrl) {
    this.comprobanteUrl = comprobanteUrl;
  }

  public EstadoPago getEstado() {
    return estado;
  }

  public void setEstado(EstadoPago estado) {
    this.estado = estado;
  }

  public String getMotivoRechazo() {
    return motivoRechazo;
  }

  public void setMotivoRechazo(String motivoRechazo) {
    this.motivoRechazo = motivoRechazo;
  }

  public String getIdAsociacion() {
    return idAsociacion;
  }

  public void setIdAsociacion(String idAsociacion) {
    this.idAsociacion = idAsociacion;
  }

  public LocalDate getFechaRegistro() {
    return fechaRegistro;
  }

  public void setFechaRegistro(LocalDate fechaRegistro) {
    this.fechaRegistro = fechaRegistro;
  }
}
