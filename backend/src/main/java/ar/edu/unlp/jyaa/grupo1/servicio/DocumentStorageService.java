package ar.edu.unlp.jyaa.grupo1.servicio;

import ar.edu.unlp.jyaa.grupo1.dao.ArchivoDAO;
import ar.edu.unlp.jyaa.grupo1.modelo.Archivo;
import ar.edu.unlp.jyaa.grupo1.modelo.TipoArchivoAlmacenado;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Persiste PDFs y comprobantes en la tabla {@code archivos} (columna BLOB). En {@link
 * ar.edu.unlp.jyaa.grupo1.modelo.Trabajo} y {@link ar.edu.unlp.jyaa.grupo1.modelo.Pago} solo se
 * guarda la URL de descarga ({@code /api/archivos/{id}}).
 */
@ApplicationScoped
public class DocumentStorageService {

  public enum TipoArchivo {
    TRABAJO(TipoArchivoAlmacenado.TRABAJO),
    COMPROBANTE(TipoArchivoAlmacenado.COMPROBANTE),
    CERTIFICADO_INSCRIPCION(TipoArchivoAlmacenado.CERTIFICADO_INSCRIPCION),
    CIRCULAR(TipoArchivoAlmacenado.CIRCULAR),
    EVALUACION_CORRECCION(TipoArchivoAlmacenado.EVALUACION_CORRECCION),
    QR_PAGO(TipoArchivoAlmacenado.QR_PAGO);

    private final TipoArchivoAlmacenado entidad;

    TipoArchivo(TipoArchivoAlmacenado entidad) {
      this.entidad = entidad;
    }

    TipoArchivoAlmacenado entidad() {
      return entidad;
    }
  }

  @Inject private ArchivoDAO archivoDAO;

  public String guardar(TipoArchivo tipo, String nombreOriginal, InputStream contenido)
      throws IOException {
    String nombre = nombreOriginal != null && !nombreOriginal.isBlank() ? nombreOriginal : "documento.pdf";
    Archivo archivo = new Archivo();
    archivo.setNombreOriginal(nombre);
    archivo.setContentType(contentTypeDe(nombre));
    archivo.setTipo(tipo.entidad());
    archivo.setContenido(contenido.readAllBytes());
    archivo.setFechaSubida(LocalDateTime.now());
    archivoDAO.alta(archivo);
    return "/api/archivos/" + archivo.getId();
  }

  public Archivo obtener(Long id) {
    Archivo archivo = archivoDAO.recuperarPorId(id);
    if (archivo == null) {
      throw new NegocioException("Archivo no encontrado");
    }
    return archivo;
  }

  /** Elimina el archivo referenciado por {@code /api/archivos/{id}} si existe. */
  public void eliminarPorUrl(String url) {
    Long id = extraerId(url);
    if (id == null) {
      return;
    }
    archivoDAO.baja(id);
  }

  /**
   * Elimina PDFs/comprobantes en {@code archivos} que ya no están referenciados por trabajos,
   * pagos, inscripciones ni circulares.
   */
  public int eliminarArchivosHuerfanos() {
    List<Long> ids = archivoDAO.listarIdsHuerfanos();
    return archivoDAO.eliminarPorIds(ids);
  }

  public long contarArchivosHuerfanos() {
    return archivoDAO.listarIdsHuerfanos().size();
  }

  private Long extraerId(String url) {
    if (url == null || url.isBlank() || !url.contains("/api/archivos/")) {
      return null;
    }
    try {
      return Long.parseLong(url.substring(url.lastIndexOf('/') + 1).trim());
    } catch (NumberFormatException e) {
      return null;
    }
  }

  private String contentTypeDe(String nombreOriginal) {
    if (nombreOriginal == null) {
      return "application/pdf";
    }
    String lower = nombreOriginal.toLowerCase();
    if (lower.endsWith(".png")) {
      return "image/png";
    }
    if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
      return "image/jpeg";
    }
    if (lower.endsWith(".webp")) {
      return "image/webp";
    }
    return "application/pdf";
  }
}
