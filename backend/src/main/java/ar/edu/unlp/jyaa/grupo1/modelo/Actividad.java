package ar.edu.unlp.jyaa.grupo1.modelo;

import jakarta.persistence.*;
import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "actividades")
public class Actividad implements Serializable {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, length = 300)
  private String titulo;

  @Column(length = 120)
  private String sala;

  /** Día lógico del evento (1, 2 o 3). Al postergar el congreso se recalculan inicio/fin. */
  @Column(name = "dia_congreso")
  private Integer diaCongreso;

  @ManyToOne(fetch = FetchType.EAGER)
  @JoinColumn(name = "aula_id")
  private Aula aula;

  private LocalDateTime inicio;
  private LocalDateTime fin;

  @Enumerated(EnumType.STRING)
  @Column(name = "tipo_actividad", nullable = false)
  private TipoActividad tipoActividad;

  @Column(length = 40)
  private String codigo;

  @Column(columnDefinition = "TEXT")
  private String descripcion;

  @Column(name = "eje_tematico", length = 300)
  private String ejeTematico;

  @Column(length = 300)
  private String moderador;

  @Column(columnDefinition = "TEXT")
  private String panelistas;

  @Column(columnDefinition = "TEXT")
  private String responsables;

  @Column(columnDefinition = "TEXT")
  private String conferencistas;

  @Column(length = 200)
  private String institucion;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "propuesta_taller_id")
  private Trabajo propuestaTaller;

  @ManyToMany
  @JoinTable(
      name = "actividad_trabajos",
      joinColumns = @JoinColumn(name = "actividad_id"),
      inverseJoinColumns = @JoinColumn(name = "trabajo_id"))
  private List<Trabajo> trabajos = new ArrayList<>();

  public Actividad() {}

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public String getTitulo() {
    return titulo;
  }

  public void setTitulo(String titulo) {
    this.titulo = titulo;
  }

  public String getSala() {
    return sala;
  }

  public void setSala(String sala) {
    this.sala = sala;
  }

  public Integer getDiaCongreso() {
    return diaCongreso;
  }

  public void setDiaCongreso(Integer diaCongreso) {
    this.diaCongreso = diaCongreso;
  }

  public Aula getAula() {
    return aula;
  }

  public void setAula(Aula aula) {
    this.aula = aula;
  }

  public LocalDateTime getInicio() {
    return inicio;
  }

  public void setInicio(LocalDateTime inicio) {
    this.inicio = inicio;
  }

  public LocalDateTime getFin() {
    return fin;
  }

  public void setFin(LocalDateTime fin) {
    this.fin = fin;
  }

  public TipoActividad getTipoActividad() {
    return tipoActividad;
  }

  public void setTipoActividad(TipoActividad tipoActividad) {
    this.tipoActividad = tipoActividad;
  }

  public String getCodigo() {
    return codigo;
  }

  public void setCodigo(String codigo) {
    this.codigo = codigo;
  }

  public String getDescripcion() {
    return descripcion;
  }

  public void setDescripcion(String descripcion) {
    this.descripcion = descripcion;
  }

  public String getEjeTematico() {
    return ejeTematico;
  }

  public void setEjeTematico(String ejeTematico) {
    this.ejeTematico = ejeTematico;
  }

  public String getModerador() {
    return moderador;
  }

  public void setModerador(String moderador) {
    this.moderador = moderador;
  }

  public String getPanelistas() {
    return panelistas;
  }

  public void setPanelistas(String panelistas) {
    this.panelistas = panelistas;
  }

  public String getResponsables() {
    return responsables;
  }

  public void setResponsables(String responsables) {
    this.responsables = responsables;
  }

  public String getConferencistas() {
    return conferencistas;
  }

  public void setConferencistas(String conferencistas) {
    this.conferencistas = conferencistas;
  }

  public String getInstitucion() {
    return institucion;
  }

  public void setInstitucion(String institucion) {
    this.institucion = institucion;
  }

  public Trabajo getPropuestaTaller() {
    return propuestaTaller;
  }

  public void setPropuestaTaller(Trabajo propuestaTaller) {
    this.propuestaTaller = propuestaTaller;
  }

  public List<Trabajo> getTrabajos() {
    return trabajos;
  }

  public void setTrabajos(List<Trabajo> trabajos) {
    this.trabajos = trabajos;
  }
}
