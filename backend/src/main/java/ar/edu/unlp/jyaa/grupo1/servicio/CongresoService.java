package ar.edu.unlp.jyaa.grupo1.servicio;

import ar.edu.unlp.jyaa.grupo1.dao.CongresoDAO;
import ar.edu.unlp.jyaa.grupo1.modelo.Congreso;
import ar.edu.unlp.jyaa.grupo1.rest.dto.CongresoConfigUpdateRequest;
import ar.edu.unlp.jyaa.grupo1.web.dto.CongresoConfigDTO;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;

@RequestScoped
public class CongresoService {

  @Inject private CongresoDAO congresoDAO;

  public CongresoConfigDTO obtenerConfig() {
    return CongresoConfigDTO.from(congresoDAO.obtenerPrincipal());
  }

  public boolean isProgramaPublicado() {
    return congresoDAO.obtenerPrincipal().isProgramaPublicado();
  }

  public CongresoConfigDTO actualizarConfig(CongresoConfigUpdateRequest request) {
    Congreso congreso = congresoDAO.obtenerPrincipal();
    if (request.programaPublicado() != null) {
      congreso.setProgramaPublicado(request.programaPublicado());
    }
    if (request.certificadosDisponiblesDesde() != null) {
      String raw = request.certificadosDisponiblesDesde().trim();
      if (raw.isEmpty()) {
        congreso.setCertificadosDisponiblesDesde(null);
      } else {
        try {
          congreso.setCertificadosDisponiblesDesde(LocalDate.parse(raw));
        } catch (DateTimeParseException e) {
          throw new NegocioException("Fecha de certificados inválida (use AAAA-MM-DD)");
        }
      }
    }
    if (request.envioTrabajosHasta() != null) {
      String raw = request.envioTrabajosHasta().trim();
      if (raw.isEmpty()) {
        congreso.setEnvioTrabajosHasta(null);
      } else {
        try {
          congreso.setEnvioTrabajosHasta(LocalDate.parse(raw));
        } catch (DateTimeParseException e) {
          throw new NegocioException("Fecha límite de envíos inválida (use AAAA-MM-DD)");
        }
      }
    }
    congresoDAO.modificar(congreso);
    return CongresoConfigDTO.from(congreso);
  }
}
