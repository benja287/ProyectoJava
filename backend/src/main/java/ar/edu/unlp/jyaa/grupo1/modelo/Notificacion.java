package ar.edu.unlp.jyaa.grupo1.modelo;

import jakarta.persistence.*;
import java.io.Serializable;
import java.time.LocalDateTime;

@Entity
@Table(name = "notificaciones")
public class Notificacion implements Serializable {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, length = 200)
  private String asunto;

  @Column(nullable = false, length = 1000)
  private String mensaje;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private CanalNotificacion canal = CanalNotificacion.INTERNO;

  @Column(name = "fecha_creacion", nullable = false)
  private LocalDateTime fechaCreacion;

  @Column(nullable = false)
  private boolean leida;

  /** Ruta relativa de la app (ej. /asistente/trabajos) para el botón "Ir a…". */
  @Column(length = 300)
  private String enlace;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "usuario_id", nullable = false)
  private Usuario usuario;

  public Notificacion() {}

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public String getAsunto() {
    return asunto;
  }

  public void setAsunto(String asunto) {
    this.asunto = asunto;
  }

  public String getMensaje() {
    return mensaje;
  }

  public void setMensaje(String mensaje) {
    this.mensaje = mensaje;
  }

  public CanalNotificacion getCanal() {
    return canal;
  }

  public void setCanal(CanalNotificacion canal) {
    this.canal = canal;
  }

  public LocalDateTime getFechaCreacion() {
    return fechaCreacion;
  }

  public void setFechaCreacion(LocalDateTime fechaCreacion) {
    this.fechaCreacion = fechaCreacion;
  }

  public boolean isLeida() {
    return leida;
  }

  public void setLeida(boolean leida) {
    this.leida = leida;
  }

  public String getEnlace() {
    return enlace;
  }

  public void setEnlace(String enlace) {
    this.enlace = enlace;
  }

  public Usuario getUsuario() {
    return usuario;
  }

  public void setUsuario(Usuario usuario) {
    this.usuario = usuario;
  }
}
