package ar.edu.unlp.jyaa.grupo1.servicio;

import ar.edu.unlp.jyaa.grupo1.dao.UsuarioDAO;
import ar.edu.unlp.jyaa.grupo1.modelo.EjesTematicos;
import ar.edu.unlp.jyaa.grupo1.modelo.Rol;
import ar.edu.unlp.jyaa.grupo1.modelo.Usuario;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;

@RequestScoped
public class EvaluadorEjeService {

  private static final int MAX_EVALUADORES_POR_EJE = 3;

  @Inject private UsuarioDAO usuarioDAO;

  public Usuario asignarEvaluadorAEje(Long usuarioId, String ejeTematico) {
    if (!EjesTematicos.esValido(ejeTematico)) {
      throw new NegocioException("Eje temático inválido");
    }
    Usuario usuario = usuarioDAO.recuperarPorId(usuarioId);
    if (usuario == null) {
      throw new NegocioException("Usuario no encontrado: " + usuarioId);
    }
    String ejeActual = usuario.getEjeTematicoEvaluador();
    if (ejeActual == null || !ejeActual.equals(ejeTematico)) {
      long enEje = usuarioDAO.contarEvaluadoresPorEje(ejeTematico, usuarioId);
      if (enEje >= MAX_EVALUADORES_POR_EJE) {
        throw new NegocioException(
            "El eje ya tiene " + MAX_EVALUADORES_POR_EJE + " evaluadores asignados");
      }
    }
    if (!usuario.getRoles().contains(Rol.EVALUADOR)) {
      usuario.getRoles().add(Rol.EVALUADOR);
    }
    usuario.setEjeTematicoEvaluador(ejeTematico);
    return usuarioDAO.modificar(usuario);
  }

  public Usuario quitarEvaluadorDeEje(Long usuarioId) {
    Usuario usuario = usuarioDAO.recuperarPorId(usuarioId);
    if (usuario == null) {
      throw new NegocioException("Usuario no encontrado: " + usuarioId);
    }
    usuario.setEjeTematicoEvaluador(null);
    return usuarioDAO.modificar(usuario);
  }
}
