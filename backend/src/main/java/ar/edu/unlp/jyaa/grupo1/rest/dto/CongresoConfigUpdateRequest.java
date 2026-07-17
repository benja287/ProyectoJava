package ar.edu.unlp.jyaa.grupo1.rest.dto;

/**
 * Update parcial de config del congreso. Los campos null no se tocan (salvo fechas con string vacío
 * vía parseFechaOpcional en algunos grupos).
 */
public class CongresoConfigUpdateRequest {

  public Boolean programaPublicado;
  public String certificadosDisponiblesDesde;
  public String envioTrabajosHasta;
  public Integer maxTrabajosAutor;
  public Integer maxTrabajosAsistente;
  public String congresoDesde;
  public String congresoHasta;
  public String inscripcionesDesde;
  public String inscripcionesHasta;
  public String evaluacionHasta;
  public String motivo;
  public String grupo;
  public String nombre;
  public String edicion;
  public String sede;
  public Double mapaLatitud;
  public Double mapaLongitud;
  public String jornadaInicio;
  public String jornadaFin;
  public String jornadaInicioDia1;
  public String jornadaFinDia1;
  public String jornadaInicioDia2;
  public String jornadaFinDia2;
  public String jornadaInicioDia3;
  public String jornadaFinDia3;

  public Boolean programaPublicado() {
    return programaPublicado;
  }

  public String certificadosDisponiblesDesde() {
    return certificadosDisponiblesDesde;
  }

  public String envioTrabajosHasta() {
    return envioTrabajosHasta;
  }

  public Integer maxTrabajosAutor() {
    return maxTrabajosAutor;
  }

  public Integer maxTrabajosAsistente() {
    return maxTrabajosAsistente;
  }

  public String congresoDesde() {
    return congresoDesde;
  }

  public String congresoHasta() {
    return congresoHasta;
  }

  public String inscripcionesDesde() {
    return inscripcionesDesde;
  }

  public String inscripcionesHasta() {
    return inscripcionesHasta;
  }

  public String evaluacionHasta() {
    return evaluacionHasta;
  }

  public String motivo() {
    return motivo;
  }

  public String grupo() {
    return grupo;
  }

  public String nombre() {
    return nombre;
  }

  public String edicion() {
    return edicion;
  }

  public String sede() {
    return sede;
  }

  public Double mapaLatitud() {
    return mapaLatitud;
  }

  public Double mapaLongitud() {
    return mapaLongitud;
  }

  public String jornadaInicio() {
    return jornadaInicio;
  }

  public String jornadaFin() {
    return jornadaFin;
  }

  public String jornadaInicioDia1() {
    return jornadaInicioDia1;
  }

  public String jornadaFinDia1() {
    return jornadaFinDia1;
  }

  public String jornadaInicioDia2() {
    return jornadaInicioDia2;
  }

  public String jornadaFinDia2() {
    return jornadaFinDia2;
  }

  public String jornadaInicioDia3() {
    return jornadaInicioDia3;
  }

  public String jornadaFinDia3() {
    return jornadaFinDia3;
  }
}
