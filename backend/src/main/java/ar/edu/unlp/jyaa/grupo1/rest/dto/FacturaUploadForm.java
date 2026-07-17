package ar.edu.unlp.jyaa.grupo1.rest.dto;

import io.swagger.v3.oas.annotations.media.Schema;

/** Solo para documentar en Swagger el upload multipart de factura (campo {@code file}). */
@Schema(name = "FacturaUploadForm")
public class FacturaUploadForm {

  @Schema(type = "string", format = "binary", description = "Factura en PDF")
  public String file;
}
