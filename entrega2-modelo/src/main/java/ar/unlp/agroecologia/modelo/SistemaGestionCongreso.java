package ar.unlp.agroecologia.modelo;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

public class SistemaGestionCongreso {
    private final Congreso congreso;
    private final List<Usuario> usuarios;
    private final List<Trabajo> trabajos;
    private final List<AsignacionEvaluacion> asignaciones;
    private final List<Actividad> actividades;
    private final List<Circular> circulares;
    private final List<Anuncio> anuncios;
    private final List<Pago> pagos;
    private final List<InscripcionCongreso> inscripciones;
    private final List<Notificacion> notificaciones;
    private final List<EnvioEmail> emails;

    public SistemaGestionCongreso(Congreso congreso) {
        this.congreso = Objects.requireNonNull(congreso);
        this.usuarios = new ArrayList<>();
        this.trabajos = new ArrayList<>();
        this.asignaciones = new ArrayList<>();
        this.actividades = new ArrayList<>();
        this.circulares = new ArrayList<>();
        this.anuncios = new ArrayList<>();
        this.pagos = new ArrayList<>();
        this.inscripciones = new ArrayList<>();
        this.notificaciones = new ArrayList<>();
        this.emails = new ArrayList<>();
    }

    public void registrarUsuario(Usuario usuario) {
        this.usuarios.add(usuario);
    }

    public void postularTrabajo(Trabajo trabajo) {
        if (!congreso.estaEtapaHabilitada(EtapaProceso.ENVIO_TRABAJOS, LocalDate.now())) {
            throw new IllegalStateException("La etapa de envio de trabajos no esta habilitada");
        }
        long trabajosDelAutor = trabajos.stream()
            .filter(t -> t.getAutorPrincipal().getId().equals(trabajo.getAutorPrincipal().getId()))
            .count();
        if (trabajosDelAutor >= 2) {
            throw new IllegalStateException("Un autor no puede tener mas de 2 trabajos");
        }
        trabajo.enviar();
        trabajos.add(trabajo);
        trabajo.getAutorPrincipal().agregarRol(Rol.AUTOR);
    }

    public void asignarTrabajoAEvaluador(Trabajo trabajo, Usuario evaluador) {
        if (!evaluador.tieneRol(Rol.EVALUADOR)) {
            throw new IllegalArgumentException("El usuario no tiene rol evaluador");
        }
        trabajo.pasarAEvaluacion();
        asignaciones.add(new AsignacionEvaluacion(trabajo, evaluador));
    }

    public void registrarPago(Pago pago) {
        pagos.add(pago);
    }

    public void registrarInscripcion(InscripcionCongreso inscripcion) {
        this.inscripciones.add(inscripcion);
    }

    public void registrarCircular(Circular circular) {
        this.circulares.add(circular);
    }

    public void registrarAnuncio(Anuncio anuncio) {
        this.anuncios.add(anuncio);
    }

    public void enviarNotificacionInterna(Usuario destinatario, String asunto, String mensaje) {
        this.notificaciones.add(new Notificacion(destinatario, asunto, mensaje, CanalNotificacion.INTERNA));
    }

    public void registrarEnvioEmail(String destinatario, String asunto, String cuerpo) {
        this.emails.add(new EnvioEmail(destinatario, asunto, cuerpo));
    }

    public void crearActividad(Actividad actividad) {
        boolean conflicto = actividades.stream().anyMatch(a ->
            a.getAula().equalsIgnoreCase(actividad.getAula()) && a.seSuperponeCon(actividad));
        if (conflicto) {
            throw new IllegalArgumentException("Conflicto de horario y lugar para la actividad");
        }
        actividades.add(actividad);
    }
}
