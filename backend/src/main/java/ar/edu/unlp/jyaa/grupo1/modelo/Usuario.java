package ar.edu.unlp.jyaa.grupo1.modelo;

import jakarta.persistence.*;
import java.io.Serializable;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "usuarios")
public class Usuario implements Serializable {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, length = 80)
  private String nombre;

  @Column(nullable = false, length = 80)
  private String apellido;

  @Column(nullable = false, unique = true, length = 180)
  private String email;

  @Column(nullable = false, length = 120)
  private String password;

  @Column(nullable = false)
  private boolean activo = true;

  @ElementCollection(fetch = FetchType.EAGER)
  @CollectionTable(name = "usuario_roles", joinColumns = @JoinColumn(name = "usuario_id"))
  @Enumerated(EnumType.STRING)
  @Column(name = "rol", length = 30)
  private Set<Rol> roles = new HashSet<>();

  @Enumerated(EnumType.STRING)
  @Column(name = "rol_actual", length = 30)
  private Rol rolActual;

  @Column(name = "categoria_inscripcion", length = 80)
  private String categoriaInscripcion;

  /** Eje temático asignado cuando el usuario actúa como evaluador. */
  @Column(name = "eje_tematico_evaluador", length = 300)
  private String ejeTematicoEvaluador;

  @OneToMany(mappedBy = "autor", cascade = CascadeType.ALL, orphanRemoval = true)
  private List<Trabajo> trabajos = new ArrayList<>();

  @OneToMany(mappedBy = "usuario", cascade = CascadeType.ALL, orphanRemoval = true)
  private List<InscripcionCongreso> inscripciones = new ArrayList<>();

  @OneToMany(mappedBy = "usuario", cascade = CascadeType.ALL, orphanRemoval = true)
  private List<Notificacion> notificaciones = new ArrayList<>();

  @OneToMany(mappedBy = "usuario", cascade = CascadeType.ALL, orphanRemoval = true)
  private List<Certificado> certificados = new ArrayList<>();

  @OneToOne(mappedBy = "usuario", cascade = CascadeType.ALL, orphanRemoval = true)
  private CronogramaPersonal cronogramaPersonal;

  public Usuario() {}

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

  public String getApellido() {
    return apellido;
  }

  public void setApellido(String apellido) {
    this.apellido = apellido;
  }

  public String getEmail() {
    return email;
  }

  public void setEmail(String email) {
    this.email = email;
  }

  public String getPassword() {
    return password;
  }

  public void setPassword(String password) {
    this.password = password;
  }

  public boolean isActivo() {
    return activo;
  }

  public void setActivo(boolean activo) {
    this.activo = activo;
  }

  public Set<Rol> getRoles() {
    return roles;
  }

  public void setRoles(Set<Rol> roles) {
    this.roles = roles;
  }

  public Rol getRolActual() {
    return rolActual;
  }

  public void setRolActual(Rol rolActual) {
    this.rolActual = rolActual;
  }

  public String getCategoriaInscripcion() {
    return categoriaInscripcion;
  }

  public void setCategoriaInscripcion(String categoriaInscripcion) {
    this.categoriaInscripcion = categoriaInscripcion;
  }

  public String getEjeTematicoEvaluador() {
    return ejeTematicoEvaluador;
  }

  public void setEjeTematicoEvaluador(String ejeTematicoEvaluador) {
    this.ejeTematicoEvaluador = ejeTematicoEvaluador;
  }

  public List<Trabajo> getTrabajos() {
    return trabajos;
  }

  public void setTrabajos(List<Trabajo> trabajos) {
    this.trabajos = trabajos;
  }

  public List<InscripcionCongreso> getInscripciones() {
    return inscripciones;
  }

  public void setInscripciones(List<InscripcionCongreso> inscripciones) {
    this.inscripciones = inscripciones;
  }

  public List<Notificacion> getNotificaciones() {
    return notificaciones;
  }

  public void setNotificaciones(List<Notificacion> notificaciones) {
    this.notificaciones = notificaciones;
  }

  public List<Certificado> getCertificados() {
    return certificados;
  }

  public void setCertificados(List<Certificado> certificados) {
    this.certificados = certificados;
  }

  public CronogramaPersonal getCronogramaPersonal() {
    return cronogramaPersonal;
  }

  public void setCronogramaPersonal(CronogramaPersonal cronogramaPersonal) {
    this.cronogramaPersonal = cronogramaPersonal;
  }
}
