package ar.edu.unlp.jyaa.grupo1.web.dto;

import ar.edu.unlp.jyaa.grupo1.modelo.Congreso;
import java.time.LocalDate;

public record CongresoConfigDTO(
    boolean programaPublicado,
    LocalDate certificadosDisponiblesDesde,
    LocalDate envioTrabajosHasta) {

  public static CongresoConfigDTO from(Congreso congreso) {
    return new CongresoConfigDTO(
        congreso.isProgramaPublicado(),
        congreso.getCertificadosDisponiblesDesde(),
        congreso.getEnvioTrabajosHasta());
  }
}
