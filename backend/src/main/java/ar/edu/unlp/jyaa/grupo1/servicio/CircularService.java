package ar.edu.unlp.jyaa.grupo1.servicio;

import ar.edu.unlp.jyaa.grupo1.dao.CircularDAO;
import ar.edu.unlp.jyaa.grupo1.modelo.Circular;
import ar.edu.unlp.jyaa.grupo1.rest.dto.CircularRequest;
import ar.edu.unlp.jyaa.grupo1.web.dto.CircularResumenDTO;
import ar.edu.unlp.jyaa.grupo1.web.dto.PaginaCircularesDTO;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.List;

@RequestScoped
public class CircularService {

  private static final int PAGE_DEFAULT = 1;
  private static final int SIZE_DEFAULT = 20;
  private static final int SIZE_MAX = 100;

  @Inject private CircularDAO circularDAO;
  @Inject private NotificacionService notificacionService;

  public PaginaCircularesDTO listarPublicadas(int page, int size) {
    int safePage = Math.max(PAGE_DEFAULT, page);
    int safeSize = Math.min(Math.max(1, size), SIZE_MAX);
    int offset = (safePage - 1) * safeSize;

    long total = circularDAO.contarPublicadas();
    List<Circular> items = circularDAO.listarPublicadasPaginado(offset, safeSize);
    int totalPages = total == 0 ? 0 : (int) Math.ceil((double) total / safeSize);

    return new PaginaCircularesDTO(items, safePage, safeSize, total, totalPages);
  }

  public PaginaCircularesDTO listarTodas(int page, int size) {
    int safePage = Math.max(PAGE_DEFAULT, page);
    int safeSize = Math.min(Math.max(1, size), SIZE_MAX);
    int offset = (safePage - 1) * safeSize;

    long total = circularDAO.contarTodas();
    List<Circular> items = circularDAO.listarTodasPaginado(offset, safeSize);
    int totalPages = total == 0 ? 0 : (int) Math.ceil((double) total / safeSize);

    return new PaginaCircularesDTO(items, safePage, safeSize, total, totalPages);
  }

  public CircularResumenDTO obtener(Long id) {
    Circular c = circularDAO.recuperarPorId(id);
    if (c == null) {
      throw new NegocioException("Circular no encontrada");
    }
    return CircularResumenDTO.from(c);
  }

  public CircularResumenDTO crear(CircularRequest request) {
    Circular c = new Circular();
    aplicarDatos(c, request);
    circularDAO.alta(c);
    if (c.isPublicada()) {
      notificarPublicacion(c);
    }
    return CircularResumenDTO.from(c);
  }

  public CircularResumenDTO modificar(Long id, CircularRequest request) {
    Circular c = circularDAO.recuperarPorId(id);
    if (c == null) {
      throw new NegocioException("Circular no encontrada");
    }
    boolean eraPublicada = c.isPublicada();
    aplicarDatos(c, request);
    circularDAO.modificar(c);
    if (!eraPublicada && c.isPublicada()) {
      notificarPublicacion(c);
    }
    return CircularResumenDTO.from(c);
  }

  public void eliminar(Long id) {
    Circular c = circularDAO.recuperarPorId(id);
    if (c == null) {
      throw new NegocioException("Circular no encontrada");
    }
    circularDAO.baja(id);
  }

  public CircularResumenDTO alternarPublicacion(Long id) {
    Circular c = circularDAO.recuperarPorId(id);
    if (c == null) {
      throw new NegocioException("Circular no encontrada");
    }
    boolean eraPublicada = c.isPublicada();
    c.setPublicada(!c.isPublicada());
    if (c.isPublicada() && c.getFechaPublicacion() == null) {
      c.setFechaPublicacion(LocalDate.now());
    }
    circularDAO.modificar(c);
    if (!eraPublicada && c.isPublicada()) {
      notificarPublicacion(c);
    }
    return CircularResumenDTO.from(c);
  }

  private void aplicarDatos(Circular c, CircularRequest request) {
    if (request.titulo() == null || request.titulo().isBlank()) {
      throw new NegocioException("El título es obligatorio");
    }
    if (request.contenido() == null || request.contenido().isBlank()) {
      throw new NegocioException("El contenido es obligatorio");
    }
    c.setTitulo(request.titulo().trim());
    c.setContenido(request.contenido().trim());
    if (request.fechaPublicacion() != null && !request.fechaPublicacion().isBlank()) {
      try {
        c.setFechaPublicacion(LocalDate.parse(request.fechaPublicacion().trim()));
      } catch (DateTimeParseException e) {
        throw new NegocioException("Fecha inválida (use AAAA-MM-DD)");
      }
    }
    if (request.publicada() != null) {
      c.setPublicada(request.publicada());
      if (c.isPublicada() && c.getFechaPublicacion() == null) {
        c.setFechaPublicacion(LocalDate.now());
      }
    }
  }

  private void notificarPublicacion(Circular c) {
    notificacionService.enviarATodos(
        "Nueva circular publicada",
        "Se publicó la circular \"" + c.getTitulo() + "\". Consultala en la sección Circulares.",
        null);
  }
}
