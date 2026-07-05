package ar.edu.unlp.jyaa.grupo1.dao;

import ar.edu.unlp.jyaa.grupo1.modelo.Notificacion;
import java.util.List;

public interface NotificacionDAO extends GenericDAO<Notificacion> {

  List<Notificacion> listarPorUsuario(Long usuarioId, int offset, int limit);

  long contarPorUsuario(Long usuarioId);

  long contarNoLeidas(Long usuarioId);
}
