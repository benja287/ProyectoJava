package ar.edu.unlp.jyaa.grupo1.modelo;

import jakarta.persistence.*;
import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "solicitudes_evaluador")
public class SolicitudEvaluador implements Serializable {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "usuario_id", nullable = false)
  private Usuario usuario;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  private EstadoSolicitudEvaluador estado = EstadoSolicitudEvaluador.PENDIENTE;

  @Column(name = "fecha_solicitud", nullable = false)
  private LocalDateTime fechaSolicitud;

  @Column(name = "fecha_revision")
  private LocalDateTime fechaRevision;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "revisado_por_id")
  private Usuario revisadoPor;

  @Column(name = "motivo_rechazo", length = 500)
  private String motivoRechazo;

  @Column(name = "nombre_completo", nullable = false, length = 200)
  private String nombreCompleto;

  @Column(nullable = false, length = 180)
  private String email;

  @Column(name = "tipo_identificacion", nullable = false, length = 40)
  private String tipoIdentificacion;

  @Column(name = "numero_identificacion", nullable = false, length = 80)
  private String numeroIdentificacion;

  @Column(nullable = false, length = 80)
  private String nacionalidad;

  @Column(length = 200)
  private String institucion;

  @Column(name = "evaluo_ediciones_congreso", nullable = false)
  private boolean evaluoEdicionesCongreso;

  @Column(name = "evaluo_otros_congresos", nullable = false)
  private boolean evaluoOtrosCongresos;

  @Column(name = "formacion_agroecologia", nullable = false, length = 80)
  private String formacionAgroecologia;

  @ElementCollection(fetch = FetchType.EAGER)
  @CollectionTable(name = "solicitud_evaluador_areas", joinColumns = @JoinColumn(name = "solicitud_id"))
  @Column(name = "area", length = 120)
  private Set<String> areasConocimiento = new HashSet<>();

  @ElementCollection(fetch = FetchType.EAGER)
  @CollectionTable(name = "solicitud_evaluador_subareas", joinColumns = @JoinColumn(name = "solicitud_id"))
  @Column(name = "subarea", length = 120)
  private Set<String> subareas = new HashSet<>();

  @OneToMany(mappedBy = "solicitud", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
  private List<SolicitudEvaluadorCapacidad> capacidades = new ArrayList<>();

  @Column(length = 2000)
  private String observaciones;

  @Column(name = "eje_asignado", length = 2000)
  private String ejeAsignado;

  @Column(name = "invitacion_taller_enviada", nullable = false)
  private boolean invitacionTallerEnviada;

  public SolicitudEvaluador() {}

  public Long getId() { return id; }
  public void setId(Long id) { this.id = id; }
  public Usuario getUsuario() { return usuario; }
  public void setUsuario(Usuario usuario) { this.usuario = usuario; }
  public EstadoSolicitudEvaluador getEstado() { return estado; }
  public void setEstado(EstadoSolicitudEvaluador estado) { this.estado = estado; }
  public LocalDateTime getFechaSolicitud() { return fechaSolicitud; }
  public void setFechaSolicitud(LocalDateTime fechaSolicitud) { this.fechaSolicitud = fechaSolicitud; }
  public LocalDateTime getFechaRevision() { return fechaRevision; }
  public void setFechaRevision(LocalDateTime fechaRevision) { this.fechaRevision = fechaRevision; }
  public Usuario getRevisadoPor() { return revisadoPor; }
  public void setRevisadoPor(Usuario revisadoPor) { this.revisadoPor = revisadoPor; }
  public String getMotivoRechazo() { return motivoRechazo; }
  public void setMotivoRechazo(String motivoRechazo) { this.motivoRechazo = motivoRechazo; }
  public String getNombreCompleto() { return nombreCompleto; }
  public void setNombreCompleto(String nombreCompleto) { this.nombreCompleto = nombreCompleto; }
  public String getEmail() { return email; }
  public void setEmail(String email) { this.email = email; }
  public String getTipoIdentificacion() { return tipoIdentificacion; }
  public void setTipoIdentificacion(String tipoIdentificacion) { this.tipoIdentificacion = tipoIdentificacion; }
  public String getNumeroIdentificacion() { return numeroIdentificacion; }
  public void setNumeroIdentificacion(String numeroIdentificacion) { this.numeroIdentificacion = numeroIdentificacion; }
  public String getNacionalidad() { return nacionalidad; }
  public void setNacionalidad(String nacionalidad) { this.nacionalidad = nacionalidad; }
  public String getInstitucion() { return institucion; }
  public void setInstitucion(String institucion) { this.institucion = institucion; }
  public boolean isEvaluoEdicionesCongreso() { return evaluoEdicionesCongreso; }
  public void setEvaluoEdicionesCongreso(boolean evaluoEdicionesCongreso) { this.evaluoEdicionesCongreso = evaluoEdicionesCongreso; }
  public boolean isEvaluoOtrosCongresos() { return evaluoOtrosCongresos; }
  public void setEvaluoOtrosCongresos(boolean evaluoOtrosCongresos) { this.evaluoOtrosCongresos = evaluoOtrosCongresos; }
  public String getFormacionAgroecologia() { return formacionAgroecologia; }
  public void setFormacionAgroecologia(String formacionAgroecologia) { this.formacionAgroecologia = formacionAgroecologia; }
  public Set<String> getAreasConocimiento() { return areasConocimiento; }
  public void setAreasConocimiento(Set<String> areasConocimiento) { this.areasConocimiento = areasConocimiento; }
  public Set<String> getSubareas() { return subareas; }
  public void setSubareas(Set<String> subareas) { this.subareas = subareas; }
  public List<SolicitudEvaluadorCapacidad> getCapacidades() { return capacidades; }
  public void setCapacidades(List<SolicitudEvaluadorCapacidad> capacidades) { this.capacidades = capacidades; }
  public String getObservaciones() { return observaciones; }
  public void setObservaciones(String observaciones) { this.observaciones = observaciones; }
  public String getEjeAsignado() { return ejeAsignado; }
  public void setEjeAsignado(String ejeAsignado) { this.ejeAsignado = ejeAsignado; }
  public boolean isInvitacionTallerEnviada() { return invitacionTallerEnviada; }
  public void setInvitacionTallerEnviada(boolean invitacionTallerEnviada) { this.invitacionTallerEnviada = invitacionTallerEnviada; }
}
