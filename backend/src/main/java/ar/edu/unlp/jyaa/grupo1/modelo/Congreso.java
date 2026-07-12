package ar.edu.unlp.jyaa.grupo1.modelo;

import jakarta.persistence.*;
import java.io.Serializable;
import java.time.LocalDate;
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
}
