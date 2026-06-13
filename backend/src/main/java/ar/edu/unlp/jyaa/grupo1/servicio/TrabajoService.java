package ar.edu.unlp.jyaa.grupo1.servicio;

import ar.edu.unlp.jyaa.grupo1.dao.TrabajoDAO;
import ar.edu.unlp.jyaa.grupo1.dao.UsuarioDAO;
import ar.edu.unlp.jyaa.grupo1.modelo.EstadoTrabajo;
import ar.edu.unlp.jyaa.grupo1.modelo.Rol;
import ar.edu.unlp.jyaa.grupo1.modelo.Trabajo;
import ar.edu.unlp.jyaa.grupo1.modelo.Usuario;
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

  public List<Trabajo> listar() {
    return trabajoDAO.listarTodos();
  }

  public List<Trabajo> listarPorAutor(Long autorId) {
    return trabajoDAO.listarPorAutor(autorId);
  }

  public Trabajo buscar(Long id) {
    Trabajo trabajo = trabajoDAO.recuperarPorId(id);
    if (trabajo == null) {
      throw new NegocioException("Trabajo no encontrado: " + id);
    }
    return trabajo;
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
