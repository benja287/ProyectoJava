package ar.edu.unlp.jyaa.grupo1.rest.dto;

import ar.edu.unlp.jyaa.grupo1.modelo.Rol;
import java.util.Set;

/**
 * Alta de usuario por admin. Si incluye rol {@code ASISTENTE}, exige datos de certificado +
 * categoría/filiación y crea inscripción + pago aprobados (asistente presencial). Opcionalmente
 * puede solicitar factura.
 */
public class UsuarioAltaRequest {

  public String nombre;
  public String apellido;
  public String email;
  public String password;
  public Set<Rol> roles;
  public Rol rolActual;
  public String categoriaInscripcion;

  /** Obligatorios si el alta incluye ASISTENTE. */
  public String telefono;

  public String tipoIdentificacion;
  public String numeroIdentificacion;
  public String nacionalidad;
  public String institucion;
  public String provincia;

  public Boolean requiereFactura;
  public String facturaRazonSocial;
  public String facturaCuit;
  public String facturaCondicionIva;
  public String facturaDomicilioFiscal;
}
