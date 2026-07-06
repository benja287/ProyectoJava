package ar.edu.unlp.jyaa.grupo1.servicio;

import ar.edu.unlp.jyaa.grupo1.config.JpaUtil;
import ar.edu.unlp.jyaa.grupo1.dao.CongresoDAO;
import ar.edu.unlp.jyaa.grupo1.modelo.Congreso;
import ar.edu.unlp.jyaa.grupo1.rest.dto.CongresoConfigUpdateRequest;
import ar.edu.unlp.jyaa.grupo1.web.dto.CongresoConfigDTO;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.List;

@RequestScoped
public class CongresoService {

  @Inject private CongresoDAO congresoDAO;

  public CongresoConfigDTO obtenerConfig() {
    return JpaUtil.ejecutarEnTransaccionReturning(this::leerConfigDesdeEm);
  }

  public boolean isProgramaPublicado() {
    return obtenerConfig().programaPublicado();
  }

  public CongresoConfigDTO actualizarConfig(CongresoConfigUpdateRequest request) {
    Long congresoId = congresoDAO.obtenerPrincipal().getId();
    if (congresoId == null) {
      throw new NegocioException("No hay congreso configurado");
    }
    return JpaUtil.ejecutarEnTransaccionReturning(
        em -> {
          Congreso congreso = em.find(Congreso.class, congresoId);
          if (congreso == null) {
            throw new NegocioException("Congreso no encontrado: " + congresoId);
          }
          if (request.programaPublicado() != null) {
            congreso.setProgramaPublicado(request.programaPublicado());
          }
          if (request.certificadosDisponiblesDesde() != null) {
            congreso.setCertificadosDisponiblesDesde(parseFechaOpcional(request.certificadosDisponiblesDesde()));
          }
          if (request.envioTrabajosHasta() != null) {
            congreso.setEnvioTrabajosHasta(parseFechaOpcional(request.envioTrabajosHasta()));
          }
          em.flush();
          return CongresoConfigDTO.from(congreso);
        });
  }

  private CongresoConfigDTO leerConfigDesdeEm(EntityManager em) {
    List<Congreso> list =
        em.createQuery("SELECT c FROM Congreso c ORDER BY c.id ASC", Congreso.class)
            .setMaxResults(1)
            .getResultList();
    if (list.isEmpty()) {
      Congreso congreso = new Congreso();
      congreso.setNombre("Congreso Argentino de Agroecología");
      congreso.setEdicion("V");
      em.persist(congreso);
      em.flush();
      return CongresoConfigDTO.from(congreso);
    }
    return CongresoConfigDTO.from(list.getFirst());
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
