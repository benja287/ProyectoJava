package ar.edu.unlp.jyaa.grupo1.servicio;

import ar.edu.unlp.jyaa.grupo1.dao.TrabajoDAO;
import ar.edu.unlp.jyaa.grupo1.dao.UsuarioDAO;
import ar.edu.unlp.jyaa.grupo1.modelo.EstadoTrabajo;
import ar.edu.unlp.jyaa.grupo1.modelo.Rol;
import ar.edu.unlp.jyaa.grupo1.modelo.Trabajo;
import ar.edu.unlp.jyaa.grupo1.modelo.Usuario;
import ar.edu.unlp.jyaa.grupo1.web.dto.PaginaTrabajosDTO;
import ar.edu.unlp.jyaa.grupo1.web.dto.TrabajoResumenDTO;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDate;
import java.util.List;

@RequestScoped
public class TrabajoService {

  @Inject private TrabajoDAO trabajoDAO;
  @Inject private UsuarioDAO usuarioDAO;
  @Inject private DocumentStorageService documentStorageService;

  private static final int PAGE_DEFAULT = 1;
  private static final int SIZE_DEFAULT = 20;
  private static final int SIZE_MAX = 100;

  public PaginaTrabajosDTO listar(int page, int size) {
    return listarPaginado(page, size, null);
  }

  public PaginaTrabajosDTO listarPorAutor(Long autorId, int page, int size) {
    if (usuarioDAO.recuperarPorId(autorId) == null) {
      throw new NegocioException("Autor no encontrado: " + autorId);
    }
    return listarPaginado(page, size, autorId);
  }

  private PaginaTrabajosDTO listarPaginado(int page, int size, Long autorId) {
    int safePage = Math.max(PAGE_DEFAULT, page);
    int safeSize = Math.min(Math.max(1, size), SIZE_MAX);
    int offset = (safePage - 1) * safeSize;

    long total =
        autorId != null ? trabajoDAO.contarPorAutor(autorId) : trabajoDAO.contar();
    List<TrabajoResumenDTO> items =
        (autorId != null
                ? trabajoDAO.listarPorAutorPaginado(autorId, offset, safeSize)
                : trabajoDAO.listarPaginado(offset, safeSize))
            .stream()
            .map(TrabajoResumenDTO::from)
            .toList();
    int totalPages = total == 0 ? 0 : (int) Math.ceil((double) total / safeSize);

    return new PaginaTrabajosDTO(items, safePage, safeSize, total, totalPages);
  }

  public Trabajo buscar(Long id) {
    return trabajoDAO
        .recuperarPorIdConAutor(id)
        .orElseThrow(() -> new NegocioException("Trabajo no encontrado: " + id));
  }

  public Trabajo crear(Long autorId, Trabajo trabajo) {
    Usuario autor = usuarioDAO.recuperarPorId(autorId);
    if (autor == null) {
      throw new NegocioException("Autor no encontrado: " + autorId);
    }
    if (!autor.getRoles().contains(Rol.AUTOR)) {
      autor.getRoles().add(Rol.AUTOR);
      usuarioDAO.modificar(autor);
    }
    trabajo.setAutor(autor);
    trabajo.setEstado(EstadoTrabajo.BORRADOR);
    trabajo.setFechaCreacion(LocalDate.now());
    return trabajoDAO.alta(trabajo);
  }

  public Trabajo enviar(Long id) {
    Trabajo trabajo = buscar(id);
    if (trabajo.getEstado() != EstadoTrabajo.BORRADOR) {
      throw new NegocioException("Solo se pueden enviar trabajos en estado borrador");
    }
    trabajo.setEstado(EstadoTrabajo.ENVIADO);
    return trabajoDAO.modificar(trabajo);
  }

  public Trabajo adjuntarDocumento(Long id, InputStream contenido, String filename) {
    Trabajo trabajo = buscar(id);
    try {
      String url =
          documentStorageService.guardar(
              DocumentStorageService.TipoArchivo.TRABAJO, filename, contenido);
      trabajo.setDocumentoUrl(url);
      return trabajoDAO.modificar(trabajo);
    } catch (IOException e) {
      throw new NegocioException("No se pudo guardar el documento: " + e.getMessage());
    }
  }
}
