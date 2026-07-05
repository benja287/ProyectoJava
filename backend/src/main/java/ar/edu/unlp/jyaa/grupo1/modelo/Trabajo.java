package ar.edu.unlp.jyaa.grupo1.modelo;

import jakarta.persistence.*;
import java.io.Serializable;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "trabajos")
public class Trabajo implements Serializable {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, length = 300)
  private String titulo;

  @Column(columnDefinition = "TEXT")
  private String resumen;

  @Column(columnDefinition = "TEXT")
  private String metodologia;

  @Column(name = "eje_tematico", length = 300)
  private String ejeTematico;

  @Enumerated(EnumType.STRING)
  @Column(length = 20)
  private ModalidadPresentacion modalidad;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private TipoTrabajo tipo;

  @Column(name = "precheck_intentos", nullable = false)
  private int precheckIntentos = 0;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private EstadoTrabajo estado = EstadoTrabajo.BORRADOR;

  @Column(name = "documento_url", length = 500)
  private String documentoUrl;

  @Column(name = "fecha_creacion")
  private LocalDate fechaCreacion;

  @ElementCollection
  @CollectionTable(name = "trabajo_coautores", joinColumns = @JoinColumn(name = "trabajo_id"))
  @Column(name = "nombre_coautor", length = 200)
  private List<String> coautores = new ArrayList<>();

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "autor_id", nullable = false)
  private Usuario autor;

  @OneToMany(mappedBy = "trabajo", cascade = CascadeType.ALL, orphanRemoval = true)
  private List<AsignacionEvaluacion> asignaciones = new ArrayList<>();

  public Trabajo() {}

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

  public String getResumen() {
    return resumen;
  }

  public void setResumen(String resumen) {
    this.resumen = resumen;
  }

  public String getMetodologia() {
    return metodologia;
  }

  public void setMetodologia(String metodologia) {
    this.metodologia = metodologia;
  }

  public String getEjeTematico() {
    return ejeTematico;
  }

  public void setEjeTematico(String ejeTematico) {
    this.ejeTematico = ejeTematico;
  }

  public ModalidadPresentacion getModalidad() {
    return modalidad;
  }

  public void setModalidad(ModalidadPresentacion modalidad) {
    this.modalidad = modalidad;
  }

  public int getPrecheckIntentos() {
    return precheckIntentos;
  }

  public void setPrecheckIntentos(int precheckIntentos) {
    this.precheckIntentos = precheckIntentos;
  }

  public TipoTrabajo getTipo() {
    return tipo;
  }

  public void setTipo(TipoTrabajo tipo) {
    this.tipo = tipo;
  }

  public EstadoTrabajo getEstado() {
    return estado;
  }

  public void setEstado(EstadoTrabajo estado) {
    this.estado = estado;
  }

  public String getDocumentoUrl() {
    return documentoUrl;
  }

  public void setDocumentoUrl(String documentoUrl) {
    this.documentoUrl = documentoUrl;
  }

  public LocalDate getFechaCreacion() {
    return fechaCreacion;
  }

  public void setFechaCreacion(LocalDate fechaCreacion) {
    this.fechaCreacion = fechaCreacion;
  }

  public List<String> getCoautores() {
    return coautores;
  }

  public void setCoautores(List<String> coautores) {
    this.coautores = coautores;
  }

  public Usuario getAutor() {
    return autor;
  }

  public void setAutor(Usuario autor) {
    this.autor = autor;
  }

  public List<AsignacionEvaluacion> getAsignaciones() {
    return asignaciones;
  }

  public void setAsignaciones(List<AsignacionEvaluacion> asignaciones) {
    this.asignaciones = asignaciones;
  }
}
