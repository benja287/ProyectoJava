package ar.edu.unlp.jyaa.grupo1.servicio;

import jakarta.enterprise.context.ApplicationScoped;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

/**
 * Almacena PDFs y comprobantes en el filesystem del servidor Tomcat.
 *
 * <p>En MySQL solo se guarda la URL/ruta ({@code documentoUrl}, {@code comprobanteUrl}). El archivo
 * binario NO va en la base (BLOB), siguiendo el diseño del diagrama UML.
 */
@ApplicationScoped
public class DocumentStorageService {

  private static final String ENV_UPLOAD_DIR = "JYAA_UPLOAD_DIR";

  public enum TipoArchivo {
    TRABAJO("trabajos"),
    COMPROBANTE("comprobantes");

    private final String carpeta;

    TipoArchivo(String carpeta) {
      this.carpeta = carpeta;
    }

    public String carpeta() {
      return carpeta;
    }
  }

  public String guardar(TipoArchivo tipo, String nombreOriginal, InputStream contenido)
      throws IOException {
    String extension = extensionDe(nombreOriginal);
    String nombreSeguro = tipo.carpeta() + "-" + UUID.randomUUID() + extension;
    Path destino = directorioBase().resolve(tipo.carpeta()).resolve(nombreSeguro);
    Files.createDirectories(destino.getParent());
    Files.copy(contenido, destino, StandardCopyOption.REPLACE_EXISTING);
    return "/api/archivos/" + tipo.carpeta() + "/" + nombreSeguro;
  }

  public Path resolver(String carpeta, String nombre) {
    Path path = directorioBase().resolve(carpeta).resolve(nombre).normalize();
    Path base = directorioBase().resolve(carpeta).normalize();
    if (!path.startsWith(base)) {
      throw new NegocioException("Ruta de archivo inválida");
    }
    if (!Files.isRegularFile(path)) {
      throw new NegocioException("Archivo no encontrado");
    }
    return path;
  }

  private Path directorioBase() {
    String custom = System.getenv(ENV_UPLOAD_DIR);
    if (custom != null && !custom.isBlank()) {
      return Path.of(custom);
    }
    String catalina = System.getProperty("catalina.base");
    if (catalina != null && !catalina.isBlank()) {
      return Path.of(catalina, "uploads", "grupo1");
    }
    return Path.of(System.getProperty("java.io.tmpdir"), "jyaa-grupo1-uploads");
  }

  private String extensionDe(String nombreOriginal) {
    if (nombreOriginal == null) {
      return ".bin";
    }
    int idx = nombreOriginal.lastIndexOf('.');
    if (idx < 0) {
      return ".pdf";
    }
    String ext = nombreOriginal.substring(idx).toLowerCase();
    return ext.matches("\\.(pdf|png|jpg|jpeg|webp)") ? ext : ".pdf";
  }
}
