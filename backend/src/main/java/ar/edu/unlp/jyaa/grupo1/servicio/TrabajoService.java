package ar.edu.unlp.jyaa.grupo1.servicio;

import ar.edu.unlp.jyaa.grupo1.dao.TrabajoDAO;
import ar.edu.unlp.jyaa.grupo1.dao.UsuarioDAO;
import ar.edu.unlp.jyaa.grupo1.dao.filtro.TrabajoFiltro;
import ar.edu.unlp.jyaa.grupo1.modelo.EstadoTrabajo;
import ar.edu.unlp.jyaa.grupo1.modelo.Rol;
import ar.edu.unlp.jyaa.grupo1.modelo.Trabajo;
import ar.edu.unlp.jyaa.grupo1.modelo.Usuario;
import ar.edu.unlp.jyaa.grupo1.security.AuthenticatedUser;
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

  public PaginaTrabajosDTO listar(int page, int size, TrabajoFiltro filtro, AuthenticatedUser auth) {
    TrabajoFiltro effective = aplicarAlcance(filtro, auth);
    return listarFiltrado(page, size, effective);
  }

  public PaginaTrabajosDTO listar(int page, int size) {
    return listarFiltrado(page, size, new TrabajoFiltro(null, null, null, null, null));
  }

  public PaginaTrabajosDTO listarPorAutor(Long autorId, int page, int size) {
    if (usuarioDAO.recuperarPorId(autorId) == null) {
      throw new NegocioException("Autor no encontrado: " + autorId);
    }
    return listarFiltrado(page, size, new TrabajoFiltro(null, null, null, null, autorId));
  }

  public static TrabajoFiltro parseFiltro(
      String titulo, String resumen, String ejeTematico, String estado, Long autorId) {
    EstadoTrabajo estadoEnum = null;
    if (estado != null && !estado.isBlank()) {
      try {
        estadoEnum = EstadoTrabajo.valueOf(estado.trim().toUpperCase());
      } catch (IllegalArgumentException e) {
        throw new NegocioException("Estado de trabajo inválido: " + estado);
      }
    }
    return new TrabajoFiltro(titulo, resumen, ejeTematico, estadoEnum, autorId);
  }

  private TrabajoFiltro aplicarAlcance(TrabajoFiltro filtro, AuthenticatedUser auth) {
    TrabajoFiltro base =
        filtro != null ? filtro : new TrabajoFiltro(null, null, null, null, null);
    if (auth.canListAllTrabajos()) {
      return base;
    }
    return new TrabajoFiltro(
        base.titulo(), base.resumen(), base.ejeTematico(), base.estado(), auth.userId());
  }

  private PaginaTrabajosDTO listarFiltrado(int page, int size, TrabajoFiltro filtro) {
    int safePage = Math.max(PAGE_DEFAULT, page);
    int safeSize = Math.min(Math.max(1, size), SIZE_MAX);
    int offset = (safePage - 1) * safeSize;

    long total = trabajoDAO.contarFiltrado(filtro);
    List<TrabajoResumenDTO> items =
        trabajoDAO.listarFiltrado(filtro, offset, safeSize).stream()
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
    if (trabajo.getEstado() == EstadoTrabajo.BORRADOR) {
      trabajo.setEstado(EstadoTrabajo.ENVIADO);
      return trabajoDAO.modificar(trabajo);
    }
    if (trabajo.getEstado() == EstadoTrabajo.APROBADO_CON_CORRECCIONES) {
      trabajo.setEstado(EstadoTrabajo.ENVIADO);
      return trabajoDAO.modificar(trabajo);
    }
    throw new NegocioException(
        "Solo se pueden enviar trabajos en borrador o reenviar correcciones pendientes");
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

  public void baja(Long id) {
    Trabajo trabajo = buscar(id);
    documentStorageService.eliminarPorUrl(trabajo.getDocumentoUrl());
    trabajoDAO.baja(id);
  }
}
