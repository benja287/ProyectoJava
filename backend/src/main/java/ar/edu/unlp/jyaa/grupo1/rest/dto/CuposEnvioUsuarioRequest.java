package ar.edu.unlp.jyaa.grupo1.rest.dto;

/** Excepción de cupo de envío de trabajos para un usuario. */
public class CuposEnvioUsuarioRequest {

  /** Null = quitar excepción y volver al límite global. */
  public Integer maxTrabajosAutorOverride;

  public Integer maxTrabajosAsistenteOverride;
  public String motivo;
}
