package ar.edu.unlp.jyaa.grupo1.web.dto;

import ar.edu.unlp.jyaa.grupo1.modelo.Congreso;
import java.time.LocalDate;

public record CongresoConfigDTO(
    String nombre,
    String edicion,
    String sede,
    boolean programaPublicado,
    LocalDate certificadosDisponiblesDesde,
    LocalDate envioTrabajosHasta,
    LocalDate congresoDesde,
    LocalDate congresoHasta,
    LocalDate inscripcionesDesde,
    LocalDate inscripcionesHasta,
    LocalDate evaluacionHasta) {

  public static CongresoConfigDTO from(Congreso congreso) {
    return new CongresoConfigDTO(
        congreso.getNombre(),
        congreso.getEdicion(),
        congreso.getSede(),
        congreso.isProgramaPublicado(),
        congreso.getCertificadosDisponiblesDesde(),
        congreso.getEnvioTrabajosHasta(),
        congreso.getCongresoDesde(),
        congreso.getCongresoHasta(),
        congreso.getInscripcionesDesde(),
        congreso.getInscripcionesHasta(),
        congreso.getEvaluacionHasta());
  }
}
