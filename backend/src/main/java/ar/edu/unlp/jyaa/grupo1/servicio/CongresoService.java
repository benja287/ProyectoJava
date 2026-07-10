package ar.edu.unlp.jyaa.grupo1.servicio;

import ar.edu.unlp.jyaa.grupo1.config.JpaUtil;
import ar.edu.unlp.jyaa.grupo1.modelo.Congreso;
import ar.edu.unlp.jyaa.grupo1.rest.dto.CongresoConfigUpdateRequest;
import ar.edu.unlp.jyaa.grupo1.web.dto.CongresoConfigDTO;
import jakarta.enterprise.context.RequestScoped;
import jakarta.persistence.EntityManager;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.List;

@RequestScoped
public class CongresoService {

  public CongresoConfigDTO obtenerConfig() {
    return JpaUtil.ejecutarEnTransaccionReturning(this::leerConfigDesdeEm);
  }

  public boolean isProgramaPublicado() {
    return obtenerConfig().programaPublicado();
  }

  public CongresoConfigDTO actualizarConfig(CongresoConfigUpdateRequest request) {
    return JpaUtil.ejecutarEnTransaccionReturning(
        em -> {
          Congreso congreso = resolverCongresoPrincipal(em);
          if (request.programaPublicado() != null) {
            congreso.setProgramaPublicado(request.programaPublicado());
          }
          if (request.certificadosDisponiblesDesde() != null) {
            congreso.setCertificadosDisponiblesDesde(
                parseFechaOpcional(request.certificadosDisponiblesDesde()));
          }
          if (request.envioTrabajosHasta() != null) {
            congreso.setEnvioTrabajosHasta(parseFechaOpcional(request.envioTrabajosHasta()));
          }
          if (request.congresoDesde() != null) {
            congreso.setCongresoDesde(parseFechaOpcional(request.congresoDesde()));
          }
          if (request.congresoHasta() != null) {
            congreso.setCongresoHasta(parseFechaOpcional(request.congresoHasta()));
          }
          if (request.inscripcionesDesde() != null) {
            congreso.setInscripcionesDesde(parseFechaOpcional(request.inscripcionesDesde()));
          }
          if (request.inscripcionesHasta() != null) {
            congreso.setInscripcionesHasta(parseFechaOpcional(request.inscripcionesHasta()));
          }
          if (request.evaluacionHasta() != null) {
            congreso.setEvaluacionHasta(parseFechaOpcional(request.evaluacionHasta()));
          }
          validarVentanas(congreso);
          em.flush();
          return CongresoConfigDTO.from(congreso);
        });
  }

  private CongresoConfigDTO leerConfigDesdeEm(EntityManager em) {
    Congreso congreso = resolverCongresoPrincipal(em);
    return CongresoConfigDTO.from(congreso);
  }

  private Congreso resolverCongresoPrincipal(EntityManager em) {
    List<Congreso> list =
        em.createQuery("SELECT c FROM Congreso c ORDER BY c.id DESC", Congreso.class)
            .setMaxResults(1)
            .getResultList();
    if (!list.isEmpty()) {
      return list.getFirst();
    }
    Congreso congreso = new Congreso();
    congreso.setNombre("Congreso Argentino de Agroecología");
    congreso.setEdicion("V");
    em.persist(congreso);
    em.flush();
    return congreso;
  }

  /** Valida coherencia de rangos. Null = sin límite (no valida). */
  static void validarVentanas(Congreso c) {
    exigirDesdeHasta(c.getCongresoDesde(), c.getCongresoHasta(), "del congreso");
    exigirDesdeHasta(c.getInscripcionesDesde(), c.getInscripcionesHasta(), "de inscripción");

    LocalDate finCongreso = c.getCongresoHasta();
    if (finCongreso != null) {
      exigirNoPosterior(c.getEnvioTrabajosHasta(), finCongreso, "envío de trabajos");
      exigirNoPosterior(c.getEvaluacionHasta(), finCongreso, "evaluación");
      exigirNoPosterior(c.getInscripcionesHasta(), finCongreso, "inscripción");
    }
  }

  private static void exigirDesdeHasta(LocalDate desde, LocalDate hasta, String etiqueta) {
    if (desde != null && hasta != null && desde.isAfter(hasta)) {
      throw new NegocioException(
          "La fecha de inicio " + etiqueta + " no puede ser posterior a la de fin.");
    }
  }

  private static void exigirNoPosterior(LocalDate fecha, LocalDate limite, String etiqueta) {
    if (fecha != null && fecha.isAfter(limite)) {
      throw new NegocioException(
          "La fecha límite de " + etiqueta + " no puede ser posterior al fin del congreso.");
    }
  }

  private static LocalDate parseFechaOpcional(String raw) {
    if (raw == null) {
      return null;
    }
    String trimmed = raw.trim();
    if (trimmed.isEmpty()) {
      return null;
    }
    try {
      return LocalDate.parse(trimmed);
    } catch (DateTimeParseException e) {
      throw new NegocioException("Fecha inválida (use AAAA-MM-DD): " + raw);
    }
  }
}
