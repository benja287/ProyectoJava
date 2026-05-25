package ar.edu.unlp.jyaa.grupo1.modelo;

import jakarta.persistence.*;
import java.io.Serializable;
import java.time.LocalDateTime;

@Entity
@Table(name = "envios_email")
public class EnvioEmail implements Serializable {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, length = 180)
  private String destinatario;

  @Column(nullable = false, length = 300)
  private String asunto;

  @Column(nullable = false, columnDefinition = "TEXT")
  private String cuerpo;

  @Column(name = "fecha_envio")
  private LocalDateTime fechaEnvio;

  @Column(nullable = false)
  private boolean enviado;

  @Column(length = 500)
  private String error;

  public EnvioEmail() {}

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public String getDestinatario() {
    return destinatario;
  }

  public void setDestinatario(String destinatario) {
    this.destinatario = destinatario;
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

  public LocalDateTime getFechaEnvio() {
    return fechaEnvio;
  }

  public void setFechaEnvio(LocalDateTime fechaEnvio) {
    this.fechaEnvio = fechaEnvio;
  }

  public boolean isEnviado() {
    return enviado;
  }

  public void setEnviado(boolean enviado) {
    this.enviado = enviado;
  }

  public String getError() {
    return error;
  }

  public void setError(String error) {
    this.error = error;
  }
}
