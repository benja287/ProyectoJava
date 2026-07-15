package ar.edu.unlp.jyaa.grupo1.dao;

import ar.edu.unlp.jyaa.grupo1.dao.filtro.NotificacionFiltro;
import ar.edu.unlp.jyaa.grupo1.modelo.Notificacion;
import java.time.LocalDateTime;
import java.util.List;

public interface NotificacionDAO extends GenericDAO<Notificacion> {

  List<Notificacion> listarPorUsuario(Long usuarioId, int offset, int limit);

  long contarPorUsuario(Long usuarioId);

  long contarNoLeidas(Long usuarioId);

  long contarTodas();

  long contarLeidas();

  List<Notificacion> listarFiltrado(NotificacionFiltro filtro, int offset, int limit);

  long contarFiltrado(NotificacionFiltro filtro);

  Notificacion recuperarPorIdConUsuario(Long id);

  int eliminarLeidas();

  int eliminarAntesDe(LocalDateTime fecha);

  int eliminarTodas();
}
