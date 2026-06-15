package ar.edu.unlp.jyaa.grupo1.rest.dto;

import io.swagger.v3.oas.annotations.media.Schema;

/** Solo para documentar en Swagger el upload multipart (campo {@code file}). */
@Schema(name = "DocumentoUploadForm")
public class DocumentoUploadForm {

  @Schema(type = "string", format = "binary", description = "Documento del trabajo (PDF)")
  public String file;
}
