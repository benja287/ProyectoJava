package ar.edu.unlp.jyaa.grupo1.dao;

/** Punto único para obtener implementaciones DAO (servlet de pruebas y capa web). */
public final class DAOFactory {

  private DAOFactory() {}

  public static UsuarioDAO getUsuarioDAO() {
    return new UsuarioDAOImpl();
  }

  public static CongresoDAO getCongresoDAO() {
    return new CongresoDAOImpl();
  }

  public static TrabajoDAO getTrabajoDAO() {
    return new TrabajoDAOImpl();
  }

  public static PagoDAO getPagoDAO() {
    return new PagoDAOImpl();
  }

  public static InscripcionCongresoDAO getInscripcionCongresoDAO() {
    return new InscripcionCongresoDAOImpl();
  }

  public static AsignacionEvaluacionDAO getAsignacionEvaluacionDAO() {
    return new AsignacionEvaluacionDAOImpl();
  }

  public static EvaluacionDAO getEvaluacionDAO() {
    return new EvaluacionDAOImpl();
  }

  public static ActividadDAO getActividadDAO() {
    return new ActividadDAOImpl();
  }

  public static CronogramaPersonalDAO getCronogramaPersonalDAO() {
    return new CronogramaPersonalDAOImpl();
  }

  public static CircularDAO getCircularDAO() {
    return new CircularDAOImpl();
  }

  public static NotificacionDAO getNotificacionDAO() {
    return new NotificacionDAOImpl();
  }

  public static EnvioEmailDAO getEnvioEmailDAO() {
    return new EnvioEmailDAOImpl();
  }

  public static PlantillaEmailDAO getPlantillaEmailDAO() {
    return new PlantillaEmailDAOImpl();
  }

  public static AnuncioDAO getAnuncioDAO() {
    return new AnuncioDAOImpl();
  }

  public static CertificadoDAO getCertificadoDAO() {
    return new CertificadoDAOImpl();
  }

  public static CongresoAnteriorDAO getCongresoAnteriorDAO() {
    return new CongresoAnteriorDAOImpl();
  }
}
