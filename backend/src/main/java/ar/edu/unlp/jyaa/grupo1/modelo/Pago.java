package ar.edu.unlp.jyaa.grupo1.modelo;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import java.io.Serializable;
import java.time.LocalDate;
import java.time.LocalDateTime;

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

  /** Número de recib físico de caja (obligatorio al aprobar efectivo). */
  @Column(name = "numero_recibo", length = 80)
  private String numeroRecibo;

  @Column(name = "observaciones_validacion", length = 1000)
  private String observacionesValidacion;

  @Column(name = "fecha_validacion")
  private LocalDateTime fechaValidacion;

  /** True si el admin confirmó tener el efectivo físico en mano al validar. */
  @Column(name = "efectivo_fisico_recibido", nullable = false)
  private boolean efectivoFisicoRecibido = false;

  @JsonIgnore
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "validado_por_id")
  private Usuario validadoPor;

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

  public String getNumeroRecibo() {
    return numeroRecibo;
  }

  public void setNumeroRecibo(String numeroRecibo) {
    this.numeroRecibo = numeroRecibo;
  }

  public String getObservacionesValidacion() {
    return observacionesValidacion;
  }

  public void setObservacionesValidacion(String observacionesValidacion) {
    this.observacionesValidacion = observacionesValidacion;
  }

  public LocalDateTime getFechaValidacion() {
    return fechaValidacion;
  }

  public void setFechaValidacion(LocalDateTime fechaValidacion) {
    this.fechaValidacion = fechaValidacion;
  }

  public boolean isEfectivoFisicoRecibido() {
    return efectivoFisicoRecibido;
  }

  public void setEfectivoFisicoRecibido(boolean efectivoFisicoRecibido) {
    this.efectivoFisicoRecibido = efectivoFisicoRecibido;
  }

  public Usuario getValidadoPor() {
    return validadoPor;
  }

  public void setValidadoPor(Usuario validadoPor) {
    this.validadoPor = validadoPor;
  }

  @JsonProperty("validadoPorId")
  public Long getValidadoPorId() {
    return validadoPor != null ? validadoPor.getId() : null;
  }

  @JsonProperty("validadoPorNombre")
  public String getValidadoPorNombre() {
    if (validadoPor == null) {
      return null;
    }
    return (validadoPor.getNombre() + " " + validadoPor.getApellido()).trim();
  }

  /**
   * Marca el pago como aprobado y deja traza de quién/cuándo/con qué recibo (auditoría de caja).
   */
  public void marcarAprobadoConAuditoria(
      Usuario admin,
      String numeroRecibo,
      String observaciones,
      boolean efectivoFisicoRecibido) {
    this.estado = EstadoPago.APROBADO;
    this.motivoRechazo = null;
    this.fechaValidacion = LocalDateTime.now();
    this.validadoPor = admin;
    this.efectivoFisicoRecibido = efectivoFisicoRecibido;
    if (numeroRecibo != null && !numeroRecibo.isBlank()) {
      this.numeroRecibo = numeroRecibo.trim();
    }
    if (observaciones != null && !observaciones.isBlank()) {
      this.observacionesValidacion = observaciones.trim();
    } else {
      this.observacionesValidacion = null;
    }
  }
}
