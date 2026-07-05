package ar.edu.unlp.jyaa.grupo1.servicio;

import ar.edu.unlp.jyaa.grupo1.dao.NotificacionDAO;
import ar.edu.unlp.jyaa.grupo1.dao.UsuarioDAO;
import ar.edu.unlp.jyaa.grupo1.modelo.CanalNotificacion;
import ar.edu.unlp.jyaa.grupo1.modelo.Notificacion;
import ar.edu.unlp.jyaa.grupo1.modelo.Rol;
import ar.edu.unlp.jyaa.grupo1.modelo.Usuario;
import ar.edu.unlp.jyaa.grupo1.web.dto.NotificacionDTO;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import java.time.LocalDateTime;
import java.util.List;

@RequestScoped
public class NotificacionService {

  private static final int MAX_MENSAJE = 1000;
  private static final int MAX_ASUNTO = 200;

  @Inject private NotificacionDAO notificacionDAO;
  @Inject private UsuarioDAO usuarioDAO;

  public void enviar(Long usuarioId, String asunto, String mensaje) {
    Usuario usuario = usuarioDAO.recuperarPorId(usuarioId);
    if (usuario == null) {
      return;
    }
    Notificacion n = crearNotificacion(usuario, asunto, mensaje);
    notificacionDAO.alta(n);
  }

  public int enviarPorRol(Rol rol, String asunto, String mensaje, Long excluirUsuarioId) {
    int enviadas = 0;
    for (Usuario u : usuarioDAO.listarPaginado(0, 500)) {
      if (excluirUsuarioId != null && excluirUsuarioId.equals(u.getId())) {
        continue;
      }
      if (u.getRoles().contains(rol)) {
        notificacionDAO.alta(crearNotificacion(u, asunto, mensaje));
        enviadas++;
      }
    }
    return enviadas;
  }

  public int enviarATodos(String asunto, String mensaje, Long excluirUsuarioId) {
    int enviadas = 0;
    for (Usuario u : usuarioDAO.listarPaginado(0, 500)) {
      if (excluirUsuarioId != null && excluirUsuarioId.equals(u.getId())) {
        continue;
      }
      notificacionDAO.alta(crearNotificacion(u, asunto, mensaje));
      enviadas++;
    }
    return enviadas;
  }

  public List<NotificacionDTO> listarPorUsuario(Long usuarioId, int page, int size) {
    int offset = Math.max(0, (page - 1) * size);
    return notificacionDAO.listarPorUsuario(usuarioId, offset, size).stream()
        .map(NotificacionDTO::from)
        .toList();
  }

  public long contarNoLeidas(Long usuarioId) {
    return notificacionDAO.contarNoLeidas(usuarioId);
  }

  public void marcarLeida(Long id, Long usuarioId) {
    Notificacion n = notificacionDAO.recuperarPorId(id);
    if (n == null || !n.getUsuario().getId().equals(usuarioId)) {
      throw new NegocioException("Notificación no encontrada");
    }
    n.setLeida(true);
    notificacionDAO.modificar(n);
  }

  public void marcarTodasLeidas(Long usuarioId) {
    for (Notificacion n : notificacionDAO.listarPorUsuario(usuarioId, 0, 200)) {
      if (!n.isLeida()) {
        n.setLeida(true);
        notificacionDAO.modificar(n);
      }
    }
  }

  private Notificacion crearNotificacion(Usuario usuario, String asunto, String mensaje) {
    if (asunto == null || asunto.isBlank()) {
      throw new NegocioException("El asunto es obligatorio");
    }
    if (mensaje == null || mensaje.isBlank()) {
      throw new NegocioException("El mensaje es obligatorio");
    }
    Notificacion n = new Notificacion();
    n.setUsuario(usuario);
    n.setAsunto(truncar(asunto.trim(), MAX_ASUNTO));
    n.setMensaje(truncar(mensaje.trim(), MAX_MENSAJE));
    n.setCanal(CanalNotificacion.INTERNO);
    n.setFechaCreacion(LocalDateTime.now());
    n.setLeida(false);
    return n;
  }

  private static String truncar(String s, int max) {
    return s.length() <= max ? s : s.substring(0, max);
  }
}
