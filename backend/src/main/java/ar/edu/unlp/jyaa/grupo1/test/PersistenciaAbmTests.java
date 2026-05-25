package ar.edu.unlp.jyaa.grupo1.test;

import ar.edu.unlp.jyaa.grupo1.config.JpaUtil;
import ar.edu.unlp.jyaa.grupo1.dao.*;
import ar.edu.unlp.jyaa.grupo1.modelo.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Casos de prueba ABM sobre todos los DAOs (tercera entrega). Invocado desde {@link
 * ar.edu.unlp.jyaa.grupo1.servlet.PersistenciaTestServlet}.
 */
public final class PersistenciaAbmTests {

  private final StringBuilder log = new StringBuilder();
  private int ok = 0;
  private int fail = 0;
  private final long stamp = System.currentTimeMillis();

  public Resultado ejecutarTodos() {
    log.append("=== Tests ABM — Capa de persistencia (Grupo 1) ===\n");
    log.append("Timestamp: ").append(stamp).append("\n\n");

    testCongreso();
    testUsuarioConRoles();
    testPago();
    testInscripcionConPago();
    testTrabajoConCoautores();
    testCircular();
    testNotificacion();
    testEnvioEmail();
    testPlantillaEmail();
    testAnuncio();
    testCertificado();
    testActividadConTrabajos();
    testCronogramaConActividades();
    testAsignacionYEvaluacion();

    log.append("\n--- Resumen ---\n");
    log.append("OK: ").append(ok).append(" | Fallos: ").append(fail).append("\n");
    return new Resultado(fail == 0, log.toString());
  }

  private void testCongreso() {
    run("Congreso (ABM + colección etapas)", () -> {
      CongresoDAO dao = DAOFactory.getCongresoDAO();
      Congreso c = new Congreso();
      c.setNombre("Test Congreso " + stamp);
      c.setEdicion("TEST");
      EtapaCongreso etapa = new EtapaCongreso();
      etapa.setEtapa(EtapaProceso.ENVIO_TRABAJOS);
      etapa.setRango(new RangoFechas(LocalDate.now(), LocalDate.now().plusMonths(1)));
      c.getEtapas().add(etapa);

      c = dao.alta(c);
      assertNotNull(dao.recuperarPorId(c.getId()), "recuperar");
      c.setNombre("Test Congreso MOD " + stamp);
      c = dao.modificar(c);
      assertTrue(dao.listarTodos().size() >= 1, "listar");
      dao.baja(c.getId());
      assertNull(dao.recuperarPorId(c.getId()), "baja");
    });
  }

  private void testUsuarioConRoles() {
    run("Usuario (ABM + colección roles)", () -> {
      UsuarioDAO dao = DAOFactory.getUsuarioDAO();
      Usuario u = new Usuario();
      u.setNombre("Test");
      u.setApellido("ABM " + stamp);
      u.setEmail("test.abm." + stamp + "@jyaa.unlp.edu.ar");
      u.setPassword("test");
      u.setActivo(true);
      u.setRoles(new HashSet<>(Set.of(Rol.AUTOR, Rol.PARTICIPANTE)));
      u.setRolActual(Rol.AUTOR);

      u = dao.alta(u);
      final Long usuarioId = u.getId();
      assertNotNull(dao.recuperarPorId(usuarioId), "recuperar");
      u.setNombre("TestMod");
      u = dao.modificar(u);
      assertTrue(
          dao.listarTodos().stream().anyMatch(x -> x.getId().equals(usuarioId)), "listar");
      dao.baja(usuarioId);
    });
  }

  private void testPago() {
    run("Pago (ABM)", () -> {
      PagoDAO dao = DAOFactory.getPagoDAO();
      Pago p = new Pago();
      p.setMonto(1500);
      p.setMetodo(MetodoPago.TRANSFERENCIA);
      p.setEstado(EstadoPago.PENDIENTE);
      p.setFechaRegistro(LocalDate.now());
      p = dao.alta(p);
      p.setEstado(EstadoPago.APROBADO);
      p = dao.modificar(p);
      assertNotNull(dao.recuperarPorId(p.getId()), "recuperar");
      dao.baja(p.getId());
    });
  }

  private void testInscripcionConPago() {
    run("InscripcionCongreso + Pago (ABM)", () -> {
      UsuarioDAO uDao = DAOFactory.getUsuarioDAO();
      InscripcionCongresoDAO iDao = DAOFactory.getInscripcionCongresoDAO();

      Usuario u = crearUsuarioPrueba("ins");
      u = uDao.alta(u);

      Pago pago = new Pago();
      pago.setMonto(2000);
      pago.setMetodo(MetodoPago.EFECTIVO);
      pago.setEstado(EstadoPago.PENDIENTE);
      pago.setFechaRegistro(LocalDate.now());

      InscripcionCongreso ins = new InscripcionCongreso();
      ins.setUsuario(uDao.recuperarPorId(u.getId()));
      ins.setPago(pago);
      ins.setCategoria("estudiante");
      ins.setEstado(EstadoInscripcion.PENDIENTE);
      ins.setFechaSolicitud(LocalDate.now());
      ins = iDao.alta(ins);

      ins.setEstado(EstadoInscripcion.APROBADA);
      ins = iDao.modificar(ins);
      assertNotNull(iDao.recuperarPorId(ins.getId()), "recuperar");
      final Long insId = ins.getId();
      final Long usuarioId = u.getId();
      iDao.baja(insId);
      uDao.baja(usuarioId);
    });
  }

  private void testTrabajoConCoautores() {
    run("Trabajo (ABM + coautores)", () -> {
      UsuarioDAO uDao = DAOFactory.getUsuarioDAO();
      TrabajoDAO tDao = DAOFactory.getTrabajoDAO();
      Usuario autor = uDao.alta(crearUsuarioPrueba("autor"));

      Trabajo t = new Trabajo();
      t.setTitulo("Trabajo test " + stamp);
      t.setResumen("Resumen");
      t.setEjeTematico("Eje 1");
      t.setTipo(TipoTrabajo.TRABAJO_CIENTIFICO);
      t.setEstado(EstadoTrabajo.ENVIADO);
      t.setFechaCreacion(LocalDate.now());
      t.setAutor(uDao.recuperarPorId(autor.getId()));
      t.getCoautores().add("Coautor A");
      t.getCoautores().add("Coautor B");
      t = tDao.alta(t);

      t.getCoautores().add("Coautor C");
      t = tDao.modificar(t);
      assertNotNull(tDao.recuperarPorId(t.getId()), "recuperar");
      assertTrue(tDao.listarPorAutor(autor.getId()).size() >= 1, "listar por autor");
      tDao.baja(t.getId());
      uDao.baja(autor.getId());
    });
  }

  private void testCircular() {
    run("Circular (ABM)", () -> {
      CircularDAO dao = DAOFactory.getCircularDAO();
      Circular c = new Circular();
      c.setTitulo("Circular test " + stamp);
      c.setContenido("Contenido");
      c.setPublicada(true);
      c.setFechaPublicacion(LocalDate.now());
      c = dao.alta(c);
      c.setContenido("Contenido modificado");
      c = dao.modificar(c);
      assertTrue(dao.listarPublicadas().size() >= 1, "listar publicadas");
      dao.baja(c.getId());
    });
  }

  private void testNotificacion() {
    run("Notificacion (ABM)", () -> {
      UsuarioDAO uDao = DAOFactory.getUsuarioDAO();
      NotificacionDAO nDao = DAOFactory.getNotificacionDAO();
      Usuario u = uDao.alta(crearUsuarioPrueba("notif"));

      Notificacion n = new Notificacion();
      n.setUsuario(uDao.recuperarPorId(u.getId()));
      n.setAsunto("Asunto " + stamp);
      n.setMensaje("Mensaje");
      n.setCanal(CanalNotificacion.INTERNO);
      n.setFechaCreacion(LocalDateTime.now());
      n.setLeida(false);
      n = nDao.alta(n);
      n.setLeida(true);
      nDao.modificar(n);
      nDao.baja(n.getId());
      uDao.baja(u.getId());
    });
  }

  private void testEnvioEmail() {
    run("EnvioEmail (ABM)", () -> {
      EnvioEmailDAO dao = DAOFactory.getEnvioEmailDAO();
      EnvioEmail e = new EnvioEmail();
      e.setDestinatario("dest." + stamp + "@test.com");
      e.setAsunto("Asunto");
      e.setCuerpo("Cuerpo");
      e.setFechaEnvio(LocalDateTime.now());
      e.setEnviado(false);
      e = dao.alta(e);
      e.setEnviado(true);
      dao.modificar(e);
      dao.baja(e.getId());
    });
  }

  private void testPlantillaEmail() {
    run("PlantillaEmail (ABM)", () -> {
      PlantillaEmailDAO dao = DAOFactory.getPlantillaEmailDAO();
      PlantillaEmail p = new PlantillaEmail();
      p.setNombre("tpl-" + stamp);
      p.setAsunto("Asunto");
      p.setCuerpo("Cuerpo");
      p = dao.alta(p);
      dao.modificar(p);
      dao.baja(p.getId());
    });
  }

  private void testAnuncio() {
    run("Anuncio (ABM)", () -> {
      AnuncioDAO dao = DAOFactory.getAnuncioDAO();
      Anuncio a = new Anuncio();
      a.setTitulo("Anuncio " + stamp);
      a.setMensaje("Mensaje");
      a.setFechaCreacion(LocalDateTime.now());
      a.setActivo(true);
      a = dao.alta(a);
      a.setActivo(false);
      dao.modificar(a);
      dao.baja(a.getId());
    });
  }

  private void testCertificado() {
    run("Certificado (ABM)", () -> {
      UsuarioDAO uDao = DAOFactory.getUsuarioDAO();
      CertificadoDAO cDao = DAOFactory.getCertificadoDAO();
      Usuario u = uDao.alta(crearUsuarioPrueba("cert"));

      Certificado cert = new Certificado();
      cert.setUsuario(uDao.recuperarPorId(u.getId()));
      cert.setArchivoUrl("/cert/" + stamp + ".pdf");
      cert.setFechaEmision(LocalDate.now());
      cert = cDao.alta(cert);
      cDao.modificar(cert);
      cDao.baja(cert.getId());
      uDao.baja(u.getId());
    });
  }

  private void testActividadConTrabajos() {
    run("Actividad (ABM + M2M trabajos)", () -> {
      UsuarioDAO uDao = DAOFactory.getUsuarioDAO();
      TrabajoDAO tDao = DAOFactory.getTrabajoDAO();
      ActividadDAO aDao = DAOFactory.getActividadDAO();

      Usuario autor = uDao.alta(crearUsuarioPrueba("act-autor"));
      Trabajo trabajo = new Trabajo();
      trabajo.setTitulo("Para mesa " + stamp);
      trabajo.setTipo(TipoTrabajo.TRABAJO_CIENTIFICO);
      trabajo.setEstado(EstadoTrabajo.APROBADO);
      trabajo.setFechaCreacion(LocalDate.now());
      trabajo.setAutor(uDao.recuperarPorId(autor.getId()));
      trabajo = tDao.alta(trabajo);

      final Long trabajoId = trabajo.getId();
      JpaUtil.ejecutarEnTransaccion(
          em -> {
            Actividad act = new Actividad();
            act.setTitulo("Mesa test " + stamp);
            act.setSala("A1");
            act.setTipoActividad(TipoActividad.MESA_TEMATICA);
            act.setInicio(LocalDateTime.now().plusDays(1));
            act.setFin(LocalDateTime.now().plusDays(1).plusHours(2));
            Trabajo tRef = em.find(Trabajo.class, trabajoId);
            act.getTrabajos().add(tRef);
            em.persist(act);
          });

      List<Actividad> lista = aDao.listarTodos();
      assertTrue(lista.stream().anyMatch(a -> a.getTrabajos().size() >= 1), "M2M cargado");
      Actividad ultima =
          lista.stream().filter(a -> a.getTitulo().contains("Mesa test")).findFirst().orElse(null);
      if (ultima != null) {
        aDao.baja(ultima.getId());
      }
      tDao.baja(trabajo.getId());
      uDao.baja(autor.getId());
    });
  }

  private void testCronogramaConActividades() {
    run("CronogramaPersonal (ABM + M2M actividades)", () -> {
      UsuarioDAO uDao = DAOFactory.getUsuarioDAO();
      ActividadDAO aDao = DAOFactory.getActividadDAO();
      CronogramaPersonalDAO cDao = DAOFactory.getCronogramaPersonalDAO();

      Usuario u = uDao.alta(crearUsuarioPrueba("crono"));
      Actividad act = new Actividad();
      act.setTitulo("Taller test " + stamp);
      act.setSala("B2");
      act.setTipoActividad(TipoActividad.TALLER);
      act.setInicio(LocalDateTime.now().plusDays(2));
      act.setFin(LocalDateTime.now().plusDays(2).plusHours(3));
      act = aDao.alta(act);

      final Long usuarioId = u.getId();
      final Long actividadId = act.getId();
      JpaUtil.ejecutarEnTransaccion(
          em -> {
            CronogramaPersonal crono = new CronogramaPersonal();
            crono.setUsuario(em.find(Usuario.class, usuarioId));
            crono.getActividades().add(em.find(Actividad.class, actividadId));
            em.persist(crono);
          });

      assertTrue(cDao.listarTodos().size() >= 1, "listar cronogramas");
      CronogramaPersonal cr =
          cDao.listarTodos().stream()
              .filter(x -> x.getUsuario().getId().equals(usuarioId))
              .findFirst()
              .orElse(null);
      if (cr != null) {
        final Long cronoId = cr.getId();
        JpaUtil.ejecutarEnTransaccion(
            em -> {
              CronogramaPersonal managed = em.find(CronogramaPersonal.class, cronoId);
              if (managed != null) {
                managed.getActividades().clear();
                em.flush();
                em.remove(managed);
              }
            });
      }
      aDao.baja(actividadId);
      uDao.baja(usuarioId);
    });
  }

  private void testAsignacionYEvaluacion() {
    run("AsignacionEvaluacion + Evaluacion (ABM)", () -> {
      UsuarioDAO uDao = DAOFactory.getUsuarioDAO();
      TrabajoDAO tDao = DAOFactory.getTrabajoDAO();
      AsignacionEvaluacionDAO aDao = DAOFactory.getAsignacionEvaluacionDAO();
      EvaluacionDAO eDao = DAOFactory.getEvaluacionDAO();

      Usuario autor = uDao.alta(crearUsuarioPrueba("asig-autor"));
      Usuario evaluador = uDao.alta(crearUsuarioPrueba("asig-eval"));
      Trabajo trabajo = new Trabajo();
      trabajo.setTitulo("Eval " + stamp);
      trabajo.setTipo(TipoTrabajo.TRABAJO_CIENTIFICO);
      trabajo.setEstado(EstadoTrabajo.EN_EVALUACION);
      trabajo.setFechaCreacion(LocalDate.now());
      trabajo.setAutor(uDao.recuperarPorId(autor.getId()));
      trabajo = tDao.alta(trabajo);

      AsignacionEvaluacion asig = new AsignacionEvaluacion();
      asig.setTrabajo(tDao.recuperarPorId(trabajo.getId()));
      asig.setEvaluador(uDao.recuperarPorId(evaluador.getId()));
      asig.setAceptada(false);
      asig = aDao.alta(asig);

      Evaluacion ev = new Evaluacion();
      ev.setAsignacion(aDao.recuperarPorId(asig.getId()));
      ev.setRecomendacion(RecomendacionEvaluacion.APROBADO);
      ev.setComentario("OK");
      ev.setFecha(LocalDate.now());
      ev = eDao.alta(ev);

      ev.setComentario("OK modificado");
      eDao.modificar(ev);
      eDao.baja(ev.getId());
      aDao.baja(asig.getId());
      tDao.baja(trabajo.getId());
      uDao.baja(evaluador.getId());
      uDao.baja(autor.getId());
    });
  }

  private Usuario crearUsuarioPrueba(String prefijo) {
    Usuario u = new Usuario();
    u.setNombre("T");
    u.setApellido(prefijo + stamp);
    u.setEmail(prefijo + "." + stamp + "@jyaa.unlp.edu.ar");
    u.setPassword("test");
    u.setActivo(true);
    u.setRoles(new HashSet<>(Set.of(Rol.PARTICIPANTE)));
    u.setRolActual(Rol.PARTICIPANTE);
    return u;
  }

  private void run(String nombre, TestCase test) {
    log.append("[").append(nombre).append("] ");
    try {
      test.ejecutar();
      ok++;
      log.append("OK\n");
    } catch (Exception e) {
      fail++;
      log.append("FALLO — ").append(e.getMessage()).append("\n");
    }
  }

  private void assertNotNull(Object o, String msg) {
    if (o == null) {
      throw new AssertionError(msg);
    }
  }

  private void assertNull(Object o, String msg) {
    if (o != null) {
      throw new AssertionError(msg);
    }
  }

  private void assertTrue(boolean cond, String msg) {
    if (!cond) {
      throw new AssertionError(msg);
    }
  }

  @FunctionalInterface
  private interface TestCase {
    void ejecutar();
  }

  public record Resultado(boolean exito, String detalle) {}
}
