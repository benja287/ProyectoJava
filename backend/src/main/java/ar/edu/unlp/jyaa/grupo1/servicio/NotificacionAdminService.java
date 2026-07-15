package ar.edu.unlp.jyaa.grupo1.servicio;

import ar.edu.unlp.jyaa.grupo1.dao.NotificacionDAO;
import ar.edu.unlp.jyaa.grupo1.dao.filtro.NotificacionFiltro;
import ar.edu.unlp.jyaa.grupo1.modelo.Notificacion;
import ar.edu.unlp.jyaa.grupo1.web.dto.LimpiezaNotificacionResultDTO;
import ar.edu.unlp.jyaa.grupo1.web.dto.NotificacionAdminDTO;
import ar.edu.unlp.jyaa.grupo1.web.dto.NotificacionResumenDTO;
import ar.edu.unlp.jyaa.grupo1.web.dto.PaginaNotificacionesDTO;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import java.time.LocalDateTime;
import java.util.List;

@RequestScoped
public class NotificacionAdminService {

  private static final int SIZE_DEFAULT = 20;
  private static final int SIZE_MAX = 100;
  private static final int DIAS_ANTIGUOS_DEFAULT = 30;

  @Inject private NotificacionDAO notificacionDAO;

  public PaginaNotificacionesDTO listar(int page, int size, Boolean leida, String destinatario) {
    int safePage = Math.max(1, page);
    int safeSize = Math.min(Math.max(1, size), SIZE_MAX);
    int offset = (safePage - 1) * safeSize;
    NotificacionFiltro filtro = new NotificacionFiltro(leida, destinatario);
    long total = notificacionDAO.contarFiltrado(filtro);
    List<NotificacionAdminDTO> items =
        notificacionDAO.listarFiltrado(filtro, offset, safeSize).stream()
            .map(NotificacionAdminDTO::from)
            .toList();
    int totalPages = total == 0 ? 0 : (int) Math.ceil((double) total / safeSize);
    return new PaginaNotificacionesDTO(items, safePage, safeSize, total, totalPages);
  }

  public NotificacionResumenDTO resumen() {
    long total = notificacionDAO.contarTodas();
    long leidas = notificacionDAO.contarLeidas();
    return new NotificacionResumenDTO(total, leidas, total - leidas);
  }

  public NotificacionAdminDTO obtener(Long id) {
    Notificacion n = notificacionDAO.recuperarPorIdConUsuario(id);
    if (n == null) {
      throw new NegocioException("Notificación no encontrada: " + id);
    }
    return NotificacionAdminDTO.from(n);
  }

  public void eliminar(Long id) {
    Notificacion n = notificacionDAO.recuperarPorId(id);
    if (n == null) {
      throw new NegocioException("Notificación no encontrada: " + id);
    }
    notificacionDAO.baja(id);
  }

  public LimpiezaNotificacionResultDTO limpiar(String alcance, Integer dias) {
    if (alcance == null || alcance.isBlank()) {
      throw new NegocioException("Debe indicar el alcance: leidas, antiguos o todos");
    }
    return switch (alcance.trim().toLowerCase()) {
      case "leidas" -> {
        int n = notificacionDAO.eliminarLeidas();
        yield new LimpiezaNotificacionResultDTO(
            n, "Se eliminaron " + n + " notificaciones leídas.");
      }
      case "antiguos" -> {
        int diasEfectivos = dias != null && dias > 0 ? dias : DIAS_ANTIGUOS_DEFAULT;
        LocalDateTime corte = LocalDateTime.now().minusDays(diasEfectivos);
        int n = notificacionDAO.eliminarAntesDe(corte);
        yield new LimpiezaNotificacionResultDTO(
            n, "Se eliminaron " + n + " notificaciones anteriores a " + diasEfectivos + " días.");
      }
      case "todos" -> {
        int n = notificacionDAO.eliminarTodas();
        yield new LimpiezaNotificacionResultDTO(
            n, "Se eliminaron todas las notificaciones (" + n + ").");
      }
      default ->
          throw new NegocioException("Alcance inválido. Use: leidas, antiguos o todos");
    };
  }
}
