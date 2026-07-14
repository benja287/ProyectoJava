package ar.edu.unlp.jyaa.grupo1.modelo;

import jakarta.persistence.*;
import java.io.Serializable;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "congresos")
public class Congreso implements Serializable {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, length = 200)
  private String nombre;

  @Column(nullable = false, length = 80)
  private String edicion;

  @Column(length = 200)
  private String sede;

  /** Centro geográfico de la sede (mapa). El rango de aulas se deriva de este punto. */
  @Column(name = "mapa_latitud")
  private Double mapaLatitud;

  @Column(name = "mapa_longitud")
  private Double mapaLongitud;

  @ElementCollection
  @CollectionTable(name = "congreso_etapas", joinColumns = @JoinColumn(name = "congreso_id"))
  private List<EtapaCongreso> etapas = new ArrayList<>();

  @Column(name = "programa_publicado", nullable = false)
  private boolean programaPublicado = false;

  @Column(name = "certificados_disponibles_desde")
  private LocalDate certificadosDisponiblesDesde;

  @Column(name = "envio_trabajos_hasta")
  private LocalDate envioTrabajosHasta;

  @Column(name = "congreso_desde")
  private LocalDate congresoDesde;

  @Column(name = "congreso_hasta")
  private LocalDate congresoHasta;

  @Column(name = "inscripciones_desde")
  private LocalDate inscripcionesDesde;

  @Column(name = "inscripciones_hasta")
  private LocalDate inscripcionesHasta;

  @Column(name = "evaluacion_hasta")
  private LocalDate evaluacionHasta;

  /** Inicio de la jornada de actividades (global; cada día puede override). */
  @Column(name = "jornada_inicio")
  private LocalTime jornadaInicio = LocalTime.of(9, 0);

  @Column(name = "jornada_fin")
  private LocalTime jornadaFin = LocalTime.of(20, 0);

  @Column(name = "jornada_inicio_dia1")
  private LocalTime jornadaInicioDia1;

  @Column(name = "jornada_fin_dia1")
  private LocalTime jornadaFinDia1;

  @Column(name = "jornada_inicio_dia2")
  private LocalTime jornadaInicioDia2;

  @Column(name = "jornada_fin_dia2")
  private LocalTime jornadaFinDia2;

  @Column(name = "jornada_inicio_dia3")
  private LocalTime jornadaInicioDia3;

  @Column(name = "jornada_fin_dia3")
  private LocalTime jornadaFinDia3;

  public Congreso() {}

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public String getNombre() {
    return nombre;
  }

  public void setNombre(String nombre) {
    this.nombre = nombre;
  }

  public String getEdicion() {
    return edicion;
  }

  public void setEdicion(String edicion) {
    this.edicion = edicion;
  }

  public String getSede() {
    return sede;
  }

  public void setSede(String sede) {
    this.sede = sede;
  }

  public Double getMapaLatitud() {
    return mapaLatitud;
  }

  public void setMapaLatitud(Double mapaLatitud) {
    this.mapaLatitud = mapaLatitud;
  }

  public Double getMapaLongitud() {
    return mapaLongitud;
  }

  public void setMapaLongitud(Double mapaLongitud) {
    this.mapaLongitud = mapaLongitud;
  }

  public List<EtapaCongreso> getEtapas() {
    return etapas;
  }

  public void setEtapas(List<EtapaCongreso> etapas) {
    this.etapas = etapas;
  }

  public boolean isProgramaPublicado() {
    return programaPublicado;
  }

  public void setProgramaPublicado(boolean programaPublicado) {
    this.programaPublicado = programaPublicado;
  }

  public LocalDate getCertificadosDisponiblesDesde() {
    return certificadosDisponiblesDesde;
  }

  public void setCertificadosDisponiblesDesde(LocalDate certificadosDisponiblesDesde) {
    this.certificadosDisponiblesDesde = certificadosDisponiblesDesde;
  }

  public LocalDate getEnvioTrabajosHasta() {
    return envioTrabajosHasta;
  }

  public void setEnvioTrabajosHasta(LocalDate envioTrabajosHasta) {
    this.envioTrabajosHasta = envioTrabajosHasta;
  }

  public LocalDate getCongresoDesde() {
    return congresoDesde;
  }

  public void setCongresoDesde(LocalDate congresoDesde) {
    this.congresoDesde = congresoDesde;
  }

  public LocalDate getCongresoHasta() {
    return congresoHasta;
  }

  public void setCongresoHasta(LocalDate congresoHasta) {
    this.congresoHasta = congresoHasta;
  }

  public LocalDate getInscripcionesDesde() {
    return inscripcionesDesde;
  }

  public void setInscripcionesDesde(LocalDate inscripcionesDesde) {
    this.inscripcionesDesde = inscripcionesDesde;
  }

  public LocalDate getInscripcionesHasta() {
    return inscripcionesHasta;
  }

  public void setInscripcionesHasta(LocalDate inscripcionesHasta) {
    this.inscripcionesHasta = inscripcionesHasta;
  }

  public LocalDate getEvaluacionHasta() {
    return evaluacionHasta;
  }

  public void setEvaluacionHasta(LocalDate evaluacionHasta) {
    this.evaluacionHasta = evaluacionHasta;
  }

  public LocalTime getJornadaInicio() {
    return jornadaInicio;
  }

  public void setJornadaInicio(LocalTime jornadaInicio) {
    this.jornadaInicio = jornadaInicio;
  }

  public LocalTime getJornadaFin() {
    return jornadaFin;
  }

  public void setJornadaFin(LocalTime jornadaFin) {
    this.jornadaFin = jornadaFin;
  }

  public LocalTime getJornadaInicioDia1() {
    return jornadaInicioDia1;
  }

  public void setJornadaInicioDia1(LocalTime jornadaInicioDia1) {
    this.jornadaInicioDia1 = jornadaInicioDia1;
  }

  public LocalTime getJornadaFinDia1() {
    return jornadaFinDia1;
  }

  public void setJornadaFinDia1(LocalTime jornadaFinDia1) {
    this.jornadaFinDia1 = jornadaFinDia1;
  }

  public LocalTime getJornadaInicioDia2() {
    return jornadaInicioDia2;
  }

  public void setJornadaInicioDia2(LocalTime jornadaInicioDia2) {
    this.jornadaInicioDia2 = jornadaInicioDia2;
  }

  public LocalTime getJornadaFinDia2() {
    return jornadaFinDia2;
  }

  public void setJornadaFinDia2(LocalTime jornadaFinDia2) {
    this.jornadaFinDia2 = jornadaFinDia2;
  }

  public LocalTime getJornadaInicioDia3() {
    return jornadaInicioDia3;
  }

  public void setJornadaInicioDia3(LocalTime jornadaInicioDia3) {
    this.jornadaInicioDia3 = jornadaInicioDia3;
  }

  public LocalTime getJornadaFinDia3() {
    return jornadaFinDia3;
  }

  public void setJornadaFinDia3(LocalTime jornadaFinDia3) {
    this.jornadaFinDia3 = jornadaFinDia3;
  }

  /** Inicio efectivo de la jornada para el día lógico 1..3. */
  public LocalTime jornadaInicioEfectiva(int diaCongreso) {
    LocalTime override =
        switch (diaCongreso) {
          case 1 -> jornadaInicioDia1;
          case 2 -> jornadaInicioDia2;
          case 3 -> jornadaInicioDia3;
          default -> null;
        };
    if (override != null) {
      return override;
    }
    return jornadaInicio != null ? jornadaInicio : LocalTime.of(9, 0);
  }

  /** Fin efectivo de la jornada para el día lógico 1..3. */
  public LocalTime jornadaFinEfectiva(int diaCongreso) {
    LocalTime override =
        switch (diaCongreso) {
          case 1 -> jornadaFinDia1;
          case 2 -> jornadaFinDia2;
          case 3 -> jornadaFinDia3;
          default -> null;
        };
    if (override != null) {
      return override;
    }
    return jornadaFin != null ? jornadaFin : LocalTime.of(20, 0);
  }
}
