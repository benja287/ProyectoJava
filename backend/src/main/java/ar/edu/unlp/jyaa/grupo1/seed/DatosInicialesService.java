package ar.edu.unlp.jyaa.grupo1.seed;

import ar.edu.unlp.jyaa.grupo1.config.JpaUtil;
import ar.edu.unlp.jyaa.grupo1.dao.UsuarioDAO;
import ar.edu.unlp.jyaa.grupo1.dao.UsuarioDAOImpl;
import ar.edu.unlp.jyaa.grupo1.modelo.*;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityTransaction;
import java.time.LocalDate;
import java.util.Set;

/** Datos demo alineados al diagrama de clases y a demoSeedUsers.ts. */
public final class DatosInicialesService {

  private DatosInicialesService() {}

  public static void cargarSiVacio() {
    UsuarioDAO dao = new UsuarioDAOImpl();
    if (!dao.listarTodos().isEmpty()) {
      return;
    }

    EntityManager em = JpaUtil.createEntityManager();
    EntityTransaction tx = em.getTransaction();
    try {
      tx.begin();

      if (em.createQuery("SELECT COUNT(c) FROM Congreso c", Long.class).getSingleResult() == 0) {
        Congreso congreso = new Congreso();
        congreso.setNombre("Congreso Argentino de Agroecología");
        congreso.setEdicion("V");
        EtapaCongreso envio = new EtapaCongreso();
        envio.setEtapa(EtapaProceso.ENVIO_TRABAJOS);
        envio.setRango(new RangoFechas(LocalDate.of(2026, 1, 1), LocalDate.of(2026, 6, 30)));
        congreso.getEtapas().add(envio);
        em.persist(congreso);
      }

      crearUsuario(em, "mantillabenja153@gmail.com", "Admin", "Principal", Set.of(Rol.ADMINISTRADOR));
      crearUsuario(
          em, "rodriguezmantilla123@gmail.com", "Comité", "Académico", Set.of(Rol.ORGANIZADOR_CIENTIFICO));
      Usuario asistente =
          crearUsuario(
              em,
              "lucasbudnik@hotmail.com.ar",
              "Asistente",
              "Principal",
              Set.of(Rol.ASISTENTE));
      InscripcionCongreso ins = new InscripcionCongreso();
      ins.setUsuario(asistente);
      ins.setCategoria("estudiante");
      ins.setEstado(EstadoInscripcion.APROBADA);
      ins.setFechaSolicitud(LocalDate.now());
      Pago pago = new Pago();
      pago.setMonto(0);
      pago.setMetodo(MetodoPago.TRANSFERENCIA);
      pago.setEstado(EstadoPago.APROBADO);
      pago.setFechaRegistro(LocalDate.now());
      ins.setPago(pago);
      em.persist(ins);

      crearUsuario(em, "alci0483@gmail.com", "Evaluador", "Principal", Set.of(Rol.EVALUADOR));
      crearUsuario(
          em,
          "autor.demo@jyaa.unlp.edu.ar",
          "Autor",
          "Demo",
          Set.of(Rol.AUTOR, Rol.ASISTENTE));

      tx.commit();
    } catch (RuntimeException e) {
      if (tx.isActive()) {
        tx.rollback();
      }
      throw e;
    } finally {
      em.close();
    }
  }

  private static Usuario crearUsuario(
      EntityManager em, String email, String nombre, String apellido, Set<Rol> roles) {
    Usuario u = new Usuario();
    u.setEmail(email);
    u.setPassword("12345678");
    u.setNombre(nombre);
    u.setApellido(apellido);
    u.setRoles(roles);
    u.setRolActual(roles.iterator().next());
    u.setActivo(true);
    em.persist(u);
    return u;
  }
}
