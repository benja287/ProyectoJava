package ar.edu.unlp.jyaa.grupo1.rest.dto;

import io.swagger.v3.oas.annotations.media.Schema;

/** Solo para documentar en Swagger el upload multipart (campo {@code file}). */
@Schema(name = "ComprobanteUploadForm")
public class ComprobanteUploadForm {

  @Schema(type = "string", format = "binary", description = "Comprobante de pago (PDF o imagen)")
  public String file;
}
