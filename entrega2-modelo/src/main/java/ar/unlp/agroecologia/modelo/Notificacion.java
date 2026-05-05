package ar.unlp.agroecologia.modelo;

import java.time.LocalDateTime;
import java.util.Objects;
import java.util.UUID;

public class Notificacion {
    private final UUID id;
    private final Usuario destinatario;
    private final String asunto;
    private final String mensaje;
    private final CanalNotificacion canal;
    private final LocalDateTime fechaCreacion;
    private boolean leida;

    public Notificacion(Usuario destinatario, String asunto, String mensaje, CanalNotificacion canal) {
        this.id = UUID.randomUUID();
        this.destinatario = Objects.requireNonNull(destinatario);
        this.asunto = Objects.requireNonNull(asunto);
        this.mensaje = Objects.requireNonNull(mensaje);
        this.canal = Objects.requireNonNull(canal);
        this.fechaCreacion = LocalDateTime.now();
        this.leida = false;
    }

    public void marcarLeida() {
        this.leida = true;
    }
}
