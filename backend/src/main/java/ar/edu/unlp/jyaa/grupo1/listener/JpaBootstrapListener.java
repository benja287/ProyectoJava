package ar.edu.unlp.jyaa.grupo1.listener;

import ar.edu.unlp.jyaa.grupo1.config.JpaUtil;
import ar.edu.unlp.jyaa.grupo1.seed.DatosInicialesService;
import jakarta.servlet.ServletContextEvent;
import jakarta.servlet.ServletContextListener;
import jakarta.servlet.annotation.WebListener;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Arranca JPA al iniciar la app (equivalente a inicializar el pool/EMF en ServletContext).
 */
@WebListener
public class JpaBootstrapListener implements ServletContextListener {

  private static final Logger log = LoggerFactory.getLogger(JpaBootstrapListener.class);

  @Override
  public void contextInitialized(ServletContextEvent sce) {
    sce.getServletContext().setAttribute("jyaa.jpa.ready", Boolean.FALSE);
    Thread bootstrap =
        new Thread(
            () -> {
              try {
                log.info("Inicializando EntityManagerFactory (jyaaPU)...");
                JpaUtil.getEntityManagerFactory();
                DatosInicialesService.cargarSiVacio();
                sce.getServletContext().setAttribute("jyaa.jpa.ready", Boolean.TRUE);
                log.info("JPA listo para grupo1.");
              } catch (RuntimeException e) {
                log.error("No se pudo iniciar JPA (revisar red/VPN y MySQL del curso)", e);
              }
            },
            "jyaa-jpa-bootstrap");
    bootstrap.setDaemon(true);
    bootstrap.start();
  }

  @Override
  public void contextDestroyed(ServletContextEvent sce) {
    log.info("Cerrando EntityManagerFactory...");
    JpaUtil.shutdown();
  }
}
