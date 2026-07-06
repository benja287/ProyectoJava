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

  @ElementCollection
  @CollectionTable(name = "congreso_etapas", joinColumns = @JoinColumn(name = "congreso_id"))
  private List<EtapaCongreso> etapas = new ArrayList<>();

  @Column(name = "programa_publicado", nullable = false)
  private boolean programaPublicado = false;

  @Column(name = "certificados_disponibles_desde")
  private LocalDate certificadosDisponiblesDesde;

  @Column(name = "envio_trabajos_hasta")
  private LocalDate envioTrabajosHasta;

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
}
