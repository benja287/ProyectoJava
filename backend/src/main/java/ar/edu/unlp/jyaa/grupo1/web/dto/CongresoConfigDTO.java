package ar.edu.unlp.jyaa.grupo1.web.dto;

import ar.edu.unlp.jyaa.grupo1.modelo.Congreso;
import java.time.LocalDate;
import java.time.LocalTime;

public record CongresoConfigDTO(
    String nombre,
    String edicion,
    String sede,
    Double mapaLatitud,
    Double mapaLongitud,
    boolean programaPublicado,
    LocalDate certificadosDisponiblesDesde,
    LocalDate envioTrabajosHasta,
    int maxTrabajosAutor,
    int maxTrabajosAsistente,
    LocalDate congresoDesde,
    LocalDate congresoHasta,
    LocalDate inscripcionesDesde,
    LocalDate inscripcionesHasta,
    LocalDate evaluacionHasta,
    String jornadaInicio,
    String jornadaFin,
    String jornadaInicioDia1,
    String jornadaFinDia1,
    String jornadaInicioDia2,
    String jornadaFinDia2,
    String jornadaInicioDia3,
    String jornadaFinDia3) {

  public static CongresoConfigDTO from(Congreso congreso) {
    return new CongresoConfigDTO(
        congreso.getNombre(),
        congreso.getEdicion(),
        congreso.getSede(),
        congreso.getMapaLatitud(),
        congreso.getMapaLongitud(),
        congreso.isProgramaPublicado(),
        congreso.getCertificadosDisponiblesDesde(),
        congreso.getEnvioTrabajosHasta(),
        Math.max(1, congreso.getMaxTrabajosAutor()),
        Math.max(1, congreso.getMaxTrabajosAsistente()),
        congreso.getCongresoDesde(),
        congreso.getCongresoHasta(),
        congreso.getInscripcionesDesde(),
        congreso.getInscripcionesHasta(),
        congreso.getEvaluacionHasta(),
        formatearHora(congreso.getJornadaInicio()),
        formatearHora(congreso.getJornadaFin()),
        formatearHora(congreso.getJornadaInicioDia1()),
        formatearHora(congreso.getJornadaFinDia1()),
        formatearHora(congreso.getJornadaInicioDia2()),
        formatearHora(congreso.getJornadaFinDia2()),
        formatearHora(congreso.getJornadaInicioDia3()),
        formatearHora(congreso.getJornadaFinDia3()));
  }

  private static String formatearHora(LocalTime t) {
    if (t == null) {
      return null;
    }
    return String.format("%02d:%02d", t.getHour(), t.getMinute());
  }
}
