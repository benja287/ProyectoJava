package ar.edu.unlp.jyaa.grupo1.servicio;

import ar.edu.unlp.jyaa.grupo1.dao.AsignacionEvaluacionDAO;
import ar.edu.unlp.jyaa.grupo1.dao.EvaluadorEjeCapacidadDAO;
import ar.edu.unlp.jyaa.grupo1.dao.UsuarioDAO;
import ar.edu.unlp.jyaa.grupo1.modelo.EvaluadorEjeCapacidad;
import ar.edu.unlp.jyaa.grupo1.modelo.Rol;
import ar.edu.unlp.jyaa.grupo1.modelo.Usuario;
import ar.edu.unlp.jyaa.grupo1.web.dto.EvaluadorEjeCupoDTO;
import ar.edu.unlp.jyaa.grupo1.web.dto.UsuarioDTO;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RequestScoped
public class EvaluadorEjeService {

  /** Capacidad por defecto al asignar un eje manualmente (sin solicitud). */
  public static final int CAPACIDAD_MANUAL_DEFAULT = 5;

  @Inject private UsuarioDAO usuarioDAO;
  @Inject private EvaluadorEjeCapacidadDAO capacidadDAO;
  @Inject private AsignacionEvaluacionDAO asignacionEvaluacionDAO;
  @Inject private CatalogoCongresoService catalogoCongresoService;

  public Usuario asignarEvaluadorAEje(Long usuarioId, String ejeTematico) {
    return asignarEvaluadorAEje(usuarioId, ejeTematico, CAPACIDAD_MANUAL_DEFAULT);
  }

  public Usuario asignarEvaluadorAEje(Long usuarioId, String ejeTematico, Integer capacidadMax) {
    catalogoCongresoService.exigirEjeValido(ejeTematico);
    int cap =
        capacidadMax != null && capacidadMax > 0 ? capacidadMax : CAPACIDAD_MANUAL_DEFAULT;
    Usuario usuario = requireUsuario(usuarioId);
    asegurarRolEvaluador(usuario);
    upsertCupo(usuario, ejeTematico.trim(), cap, true);
    sincronizarEjePrincipal(usuario);
    return usuarioDAO.modificar(usuario);
  }

  /**
   * Al aprobar una solicitud: crea/actualiza cupos para todos los ejes con capacidad &gt; 0.
   * {@code restantes} se inicializa en la capacidad declarada.
   */
  public Usuario asignarCuposDesdeSolicitud(Long usuarioId, Map<String, Integer> capacidadesPorEje) {
    if (capacidadesPorEje == null || capacidadesPorEje.isEmpty()) {
      throw new NegocioException("La solicitud no declara capacidad en ningún eje");
    }
    Usuario usuario = requireUsuario(usuarioId);
    asegurarRolEvaluador(usuario);
    int asignados = 0;
    for (Map.Entry<String, Integer> e : capacidadesPorEje.entrySet()) {
      String eje = e.getKey() != null ? e.getKey().trim() : "";
      Integer cap = e.getValue();
      if (cap == null || cap <= 0 || !catalogoCongresoService.esEjeActivo(eje)) {
        continue;
      }
      upsertCupo(usuario, eje, cap, true);
      asignados++;
    }
    if (asignados == 0) {
      throw new NegocioException(
          "No hay ejes con capacidad > 0 para asignar. Revisá la solicitud.");
    }
    sincronizarEjePrincipal(usuario);
    return usuarioDAO.modificar(usuario);
  }

  public Usuario quitarEvaluadorDeEje(Long usuarioId) {
    Usuario usuario = requireUsuario(usuarioId);
    for (EvaluadorEjeCapacidad c : capacidadDAO.listarPorUsuario(usuarioId)) {
      c.setActivo(false);
      c.setRestantes(0);
      capacidadDAO.modificar(c);
    }
    usuario.setEjeTematicoEvaluador(null);
    if (usuario.getRoles() != null) {
      usuario.getRoles().remove(Rol.EVALUADOR);
    }
    if (usuario.getRolActual() == Rol.EVALUADOR) {
      usuario.setRolActual(
          usuario.getRoles() != null && !usuario.getRoles().isEmpty()
              ? usuario.getRoles().iterator().next()
              : null);
    }
    return usuarioDAO.modificar(usuario);
  }

  /** Solo desactiva cupos y limpia eje (el rol ya fue removido por otra operación). */
  public void limpiarCuposYEje(Long usuarioId) {
    Usuario usuario = requireUsuario(usuarioId);
    for (EvaluadorEjeCapacidad c : capacidadDAO.listarPorUsuario(usuarioId)) {
      c.setActivo(false);
      c.setRestantes(0);
      capacidadDAO.modificar(c);
    }
    usuario.setEjeTematicoEvaluador(null);
    usuarioDAO.modificar(usuario);
  }

  public Usuario quitarEvaluadorDeUnEje(Long usuarioId, String ejeTematico) {
    if (ejeTematico == null || ejeTematico.isBlank()) {
      return quitarEvaluadorDeEje(usuarioId);
    }
    if (!catalogoCongresoService.esEjeActivo(ejeTematico)) {
      throw new NegocioException("Eje temático inválido");
    }
    Usuario usuario = requireUsuario(usuarioId);
    EvaluadorEjeCapacidad cupo =
        capacidadDAO
            .buscarPorUsuarioYEje(usuarioId, ejeTematico.trim())
            .orElseThrow(() -> new NegocioException("El evaluador no tiene cupo en ese eje"));
    cupo.setActivo(false);
    cupo.setRestantes(0);
    capacidadDAO.modificar(cupo);
    sincronizarEjePrincipal(usuario);
    return usuarioDAO.modificar(usuario);
  }

  /** Restaura restantes = capacidadMax para ese eje (solo si el cupo está activo). */
  public Usuario reiniciarCupo(Long usuarioId, String ejeTematico) {
    if (!catalogoCongresoService.esEjeActivo(ejeTematico)) {
      throw new NegocioException("Eje temático inválido");
    }
    Usuario usuario = requireUsuario(usuarioId);
    EvaluadorEjeCapacidad cupo =
        capacidadDAO
            .buscarPorUsuarioYEje(usuarioId, ejeTematico.trim())
            .orElseThrow(() -> new NegocioException("No hay cupo registrado para ese eje"));
    if (!cupo.isActivo()) {
      throw new NegocioException("El cupo de ese eje está inactivo. Volvé a asignar el eje.");
    }
    cupo.setRestantes(cupo.getCapacidadMax());
    capacidadDAO.modificar(cupo);
    sincronizarEjePrincipal(usuario);
    return usuarioDAO.modificar(usuario);
  }

  public boolean puedeRecibirAsignacion(Long evaluadorId, String ejeTematico) {
    if (evaluadorId == null || ejeTematico == null || ejeTematico.isBlank()) {
      return false;
    }
    var cupoOpt = capacidadDAO.buscarPorUsuarioYEje(evaluadorId, ejeTematico.trim());
    if (cupoOpt.isPresent()) {
      EvaluadorEjeCapacidad c = cupoOpt.get();
      return c.isActivo() && c.getRestantes() > 0;
    }
    // Legacy: sin filas de cupo, se usa el eje único del usuario
    Usuario u = usuarioDAO.recuperarPorId(evaluadorId);
    return u != null
        && u.getEjeTematicoEvaluador() != null
        && ejeTematico.trim().equals(u.getEjeTematicoEvaluador());
  }

  public void consumirCupo(Long evaluadorId, String ejeTematico) {
    capacidadDAO
        .buscarPorUsuarioYEje(evaluadorId, ejeTematico.trim())
        .ifPresent(
            c -> {
              if (!c.isActivo()) {
                throw new NegocioException("El cupo del evaluador en ese eje está inactivo");
              }
              if (c.getRestantes() <= 0) {
                throw new NegocioException(
                    "El evaluador agotó su cupo en este eje. Reiniciá el cupo para seguir asignando.");
              }
              c.setRestantes(c.getRestantes() - 1);
              capacidadDAO.modificar(c);
            });
  }

  public void devolverCupo(Long evaluadorId, String ejeTematico) {
    if (evaluadorId == null || ejeTematico == null || ejeTematico.isBlank()) {
      return;
    }
    capacidadDAO
        .buscarPorUsuarioYEje(evaluadorId, ejeTematico.trim())
        .ifPresent(
            c -> {
              if (!c.isActivo()) {
                return;
              }
              if (c.getRestantes() < c.getCapacidadMax()) {
                c.setRestantes(c.getRestantes() + 1);
                capacidadDAO.modificar(c);
              }
            });
  }

  public List<EvaluadorEjeCupoDTO> listarCuposDto(Long usuarioId) {
    return capacidadDAO.listarPorUsuario(usuarioId).stream()
        .filter(EvaluadorEjeCapacidad::isActivo)
        .sorted(Comparator.comparing(EvaluadorEjeCapacidad::getEjeTematico))
        .map(c -> toCupoDtoReconciliado(usuarioId, c))
        .toList();
  }

  public UsuarioDTO toDto(Usuario u) {
    if (u == null) {
      return null;
    }
    return UsuarioDTO.from(u, listarCuposDto(u.getId()));
  }

  public List<UsuarioDTO> toDtos(List<Usuario> usuarios) {
    if (usuarios == null || usuarios.isEmpty()) {
      return List.of();
    }
    List<Long> ids = usuarios.stream().map(Usuario::getId).toList();
    Map<Long, List<EvaluadorEjeCupoDTO>> porUsuario = cuposAgrupados(ids);
    List<UsuarioDTO> out = new ArrayList<>(usuarios.size());
    for (Usuario u : usuarios) {
      out.add(UsuarioDTO.from(u, porUsuario.getOrDefault(u.getId(), List.of())));
    }
    return out;
  }

  private Map<Long, List<EvaluadorEjeCupoDTO>> cuposAgrupados(Collection<Long> usuarioIds) {
    Map<Long, List<EvaluadorEjeCupoDTO>> out = new HashMap<>();
    for (EvaluadorEjeCapacidad c : capacidadDAO.listarPorUsuarios(usuarioIds)) {
      if (!c.isActivo()) {
        continue;
      }
      Long uid = c.getUsuario().getId();
      out.computeIfAbsent(uid, k -> new ArrayList<>()).add(toCupoDtoReconciliado(uid, c));
    }
    for (List<EvaluadorEjeCupoDTO> list : out.values()) {
      list.sort(Comparator.comparing(EvaluadorEjeCupoDTO::ejeTematico));
    }
    return out;
  }

  /**
   * Alinea restantes con asignaciones reales sin dictamen. Si ya dictaminaron y el cupo no se
   * liberó (datos viejos), corrige restantes al listar.
   */
  private EvaluadorEjeCupoDTO toCupoDtoReconciliado(Long usuarioId, EvaluadorEjeCapacidad c) {
    int pendientes =
        (int)
            asignacionEvaluacionDAO.contarPendientesDictamenPorEvaluadorYEje(
                usuarioId, c.getEjeTematico());
    int consumidosEsperados = Math.min(c.getCapacidadMax(), pendientes);
    int restantesEsperados = c.getCapacidadMax() - consumidosEsperados;
    if (c.getRestantes() != restantesEsperados) {
      c.setRestantes(Math.max(0, restantesEsperados));
      capacidadDAO.modificar(c);
    }
    return EvaluadorEjeCupoDTO.from(c, pendientes);
  }

  private void upsertCupo(Usuario usuario, String eje, int capacidadMax, boolean activo) {
    EvaluadorEjeCapacidad cupo =
        capacidadDAO
            .buscarPorUsuarioYEje(usuario.getId(), eje)
            .orElseGet(
                () -> {
                  EvaluadorEjeCapacidad nuevo = new EvaluadorEjeCapacidad();
                  nuevo.setUsuario(usuario);
                  nuevo.setEjeTematico(eje);
                  return nuevo;
                });
    cupo.setCapacidadMax(capacidadMax);
    cupo.setRestantes(capacidadMax);
    cupo.setActivo(activo);
    if (cupo.getId() == null) {
      capacidadDAO.alta(cupo);
    } else {
      capacidadDAO.modificar(cupo);
    }
  }

  private void sincronizarEjePrincipal(Usuario usuario) {
    List<EvaluadorEjeCapacidad> activos = capacidadDAO.listarActivosPorUsuario(usuario.getId());
    if (activos.isEmpty()) {
      usuario.setEjeTematicoEvaluador(null);
      return;
    }
    activos.stream()
        .filter(c -> c.getRestantes() > 0)
        .max(Comparator.comparingInt(EvaluadorEjeCapacidad::getRestantes))
        .or(() -> activos.stream().max(Comparator.comparingInt(EvaluadorEjeCapacidad::getCapacidadMax)))
        .ifPresent(c -> usuario.setEjeTematicoEvaluador(c.getEjeTematico()));
  }

  private void asegurarRolEvaluador(Usuario usuario) {
    if (!usuario.getRoles().contains(Rol.EVALUADOR)) {
      usuario.getRoles().add(Rol.EVALUADOR);
    }
  }

  private Usuario requireUsuario(Long usuarioId) {
    Usuario usuario = usuarioDAO.recuperarPorId(usuarioId);
    if (usuario == null) {
      throw new NegocioException("Usuario no encontrado: " + usuarioId);
    }
    return usuario;
  }
}
