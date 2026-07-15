package ar.edu.unlp.jyaa.grupo1.servicio;

import ar.edu.unlp.jyaa.grupo1.dao.NotificacionDAO;
import ar.edu.unlp.jyaa.grupo1.web.dto.LimpiezaNotificacionResultDTO;
import ar.edu.unlp.jyaa.grupo1.web.dto.NotificacionResumenDTO;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import java.time.LocalDateTime;

@RequestScoped
public class NotificacionAdminService {

  private static final int DIAS_ANTIGUOS_DEFAULT = 30;

  @Inject private NotificacionDAO notificacionDAO;

  public NotificacionResumenDTO resumen() {
    long total = notificacionDAO.contarTodas();
    long leidas = notificacionDAO.contarLeidas();
    return new NotificacionResumenDTO(total, leidas, total - leidas);
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
