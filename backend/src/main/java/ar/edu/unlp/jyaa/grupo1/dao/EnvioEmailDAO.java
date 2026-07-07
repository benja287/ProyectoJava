package ar.edu.unlp.jyaa.grupo1.dao;

import ar.edu.unlp.jyaa.grupo1.dao.filtro.EnvioEmailFiltro;
import ar.edu.unlp.jyaa.grupo1.modelo.EnvioEmail;
import java.time.LocalDateTime;

public interface EnvioEmailDAO extends GenericDAO<EnvioEmail> {

  java.util.List<EnvioEmail> listarFiltrado(EnvioEmailFiltro filtro, int offset, int limit);

  long contarFiltrado(EnvioEmailFiltro filtro);

  long contarEnviados();

  long contarFallidos();

  int eliminarFallidos();

  int eliminarAntesDe(LocalDateTime fecha);

  int eliminarTodos();
}
