package ar.edu.unlp.jyaa.grupo1.servicio;

/** Excepción de reglas de negocio → HTTP 400 en la capa REST. */
public class NegocioException extends RuntimeException {

  public NegocioException(String message) {
    super(message);
  }
}
