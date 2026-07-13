package ar.edu.unlp.jyaa.grupo1.servicio;

import ar.edu.unlp.jyaa.grupo1.config.MailConfig;
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
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RequestScoped
public class NotificacionService {

  private static final int MAX_MENSAJE = 1000;
  private static final int MAX_ASUNTO = 200;
  private static final int MAX_ENLACE = 300;

  @Inject private NotificacionDAO notificacionDAO;
  @Inject private UsuarioDAO usuarioDAO;
  @Inject private EmailService emailService;
  @Inject private MailConfig mailConfig;

  public void enviar(Long usuarioId, String asunto, String mensaje) {
    enviar(usuarioId, asunto, mensaje, null);
  }

  public void enviar(Long usuarioId, String asunto, String mensaje, String enlace) {
    Usuario usuario = usuarioDAO.recuperarPorId(usuarioId);
    if (usuario == null) {
      return;
    }
    notificacionDAO.alta(
        crearNotificacion(usuario, asunto, mensaje, CanalNotificacion.INTERNO, enlace));
    enviarEmailSiCorresponde(usuario, asunto, mensajeConEnlaceEmail(mensaje, enlace));
  }

  public void enviarConPlantilla(Long usuarioId, String nombrePlantilla, Map<String, String> variables) {
    Usuario usuario = usuarioDAO.recuperarPorId(usuarioId);
    if (usuario == null) {
      return;
    }
    Map<String, String> vars = enriquecerVariables(usuario, variables);
    String enlace = enlaceDesdeVars(vars);
    var contenido = emailService.renderizarPlantilla(nombrePlantilla, vars);
    if (contenido.isPresent()) {
      String asunto = contenido.get().asunto();
      String mensaje = contenido.get().cuerpo();
      notificacionDAO.alta(
          crearNotificacion(usuario, asunto, mensaje, CanalNotificacion.EMAIL, enlace));
      emailService.enviarConPlantillaEnSegundoPlano(nombrePlantilla, emailDestino(usuario), vars);
      return;
    }
    notificacionDAO.alta(
        crearNotificacion(
            usuario,
            "Aviso del congreso",
            "Tenés una actualización sobre tu trabajo. Ingresá a la plataforma.",
            CanalNotificacion.INTERNO,
            enlace));
  }

  public int enviarPorRol(Rol rol, String asunto, String mensaje, Long excluirUsuarioId) {
    return enviarPorRol(rol, asunto, mensaje, excluirUsuarioId, null);
  }

  public int enviarPorRol(
      Rol rol, String asunto, String mensaje, Long excluirUsuarioId, String enlace) {
    int enviadas = 0;
    for (Usuario u : usuarioDAO.listarPaginado(0, 500)) {
      if (excluirUsuarioId != null && excluirUsuarioId.equals(u.getId())) {
        continue;
      }
      if (u.getRoles().contains(rol)) {
        notificacionDAO.alta(
            crearNotificacion(u, asunto, mensaje, CanalNotificacion.INTERNO, enlace));
        enviarEmailSiCorresponde(u, asunto, mensajeConEnlaceEmail(mensaje, enlace));
        enviadas++;
      }
    }
    return enviadas;
  }

  public int enviarPorRolConPlantilla(
      Rol rol, String nombrePlantilla, Map<String, String> variables, Long excluirUsuarioId) {
    int enviadas = 0;
    for (Usuario u : usuarioDAO.listarPaginado(0, 500)) {
      if (excluirUsuarioId != null && excluirUsuarioId.equals(u.getId())) {
        continue;
      }
      if (!u.getRoles().contains(rol)) {
        continue;
      }
      Map<String, String> vars = enriquecerVariables(u, variables);
      String enlace = enlaceDesdeVars(vars);
      var contenido = emailService.renderizarPlantilla(nombrePlantilla, vars);
      if (contenido.isPresent()) {
        notificacionDAO.alta(
            crearNotificacion(
                u,
                contenido.get().asunto(),
                contenido.get().cuerpo(),
                CanalNotificacion.EMAIL,
                enlace));
        emailService.enviarConPlantillaEnSegundoPlano(
            nombrePlantilla, emailDestino(u), vars);
      } else {
        notificacionDAO.alta(
            crearNotificacion(
                u,
                "Aviso del congreso",
                "Hay trabajos pendientes de gestión. Ingresá a la plataforma.",
                CanalNotificacion.INTERNO,
                enlace));
      }
      enviadas++;
    }
    return enviadas;
  }

  public int enviarATodos(String asunto, String mensaje, Long excluirUsuarioId) {
    int enviadas = 0;
    for (Usuario u : usuarioDAO.listarPaginado(0, 500)) {
      if (excluirUsuarioId != null && excluirUsuarioId.equals(u.getId())) {
        continue;
      }
      notificacionDAO.alta(crearNotificacion(u, asunto, mensaje, CanalNotificacion.INTERNO, null));
      enviarEmailSiCorresponde(u, asunto, mensaje);
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

  private void enviarEmailSiCorresponde(Usuario usuario, String asunto, String mensaje) {
    String email = emailDestino(usuario);
    if (email.isBlank()) {
      return;
    }
    emailService.enviarEnSegundoPlano(email, asunto, mensaje);
  }

  private Map<String, String> enriquecerVariables(Usuario usuario, Map<String, String> variables) {
    Map<String, String> vars = variables != null ? new HashMap<>(variables) : new HashMap<>();
    vars.putIfAbsent("nombre", nombreCompleto(usuario));
    String base = mailConfig.getPublicUrl();
    if (base != null && base.endsWith("/")) {
      base = base.substring(0, base.length() - 1);
    }
    vars.putIfAbsent("url_plataforma", base != null ? base : "");
    vars.putIfAbsent("contexto", "");
    vars.putIfAbsent("proximo_paso", "Ingresá a la plataforma para continuar.");
    String enlace = enlaceDesdeVars(vars);
    if (enlace != null && !enlace.isBlank()) {
      String path = enlace.startsWith("/") ? enlace : "/" + enlace;
      vars.putIfAbsent("url_accion", vars.get("url_plataforma") + path);
    } else {
      vars.putIfAbsent("url_accion", vars.get("url_plataforma"));
    }
    return vars;
  }

  private static String enlaceDesdeVars(Map<String, String> vars) {
    if (vars == null) {
      return null;
    }
    String enlace = vars.get("enlace");
    return enlace != null && !enlace.isBlank() ? enlace.trim() : null;
  }

  private String mensajeConEnlaceEmail(String mensaje, String enlace) {
    if (enlace == null || enlace.isBlank()) {
      return mensaje;
    }
    String base = mailConfig.getPublicUrl();
    if (base != null && base.endsWith("/")) {
      base = base.substring(0, base.length() - 1);
    }
    String path = enlace.startsWith("/") ? enlace : "/" + enlace;
    return mensaje + "\n\nAbrí la pantalla: " + (base != null ? base : "") + path;
  }

  private static String emailDestino(Usuario usuario) {
    return usuario.getEmail() != null ? usuario.getEmail().trim() : "";
  }

  private static String nombreCompleto(Usuario usuario) {
    return (usuario.getNombre() + " " + usuario.getApellido()).trim();
  }

  private Notificacion crearNotificacion(
      Usuario usuario, String asunto, String mensaje, CanalNotificacion canal, String enlace) {
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
    n.setCanal(canal);
    n.setFechaCreacion(LocalDateTime.now());
    n.setLeida(false);
    if (enlace != null && !enlace.isBlank()) {
      n.setEnlace(truncar(enlace.trim(), MAX_ENLACE));
    }
    return n;
  }

  private static String truncar(String s, int max) {
    return s.length() <= max ? s : s.substring(0, max);
  }
}
