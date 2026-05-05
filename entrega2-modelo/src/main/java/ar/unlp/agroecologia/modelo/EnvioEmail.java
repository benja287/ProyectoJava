package ar.unlp.agroecologia.modelo;

import java.time.LocalDateTime;
import java.util.UUID;

public class EnvioEmail {
    private final UUID id;
    private final String destinatario;
    private final String asunto;
    private final String cuerpo;
    private final LocalDateTime fechaEnvio;
    private boolean enviado;
    private String error;

    public EnvioEmail(String destinatario, String asunto, String cuerpo) {
        this.id = UUID.randomUUID();
        this.destinatario = destinatario;
        this.asunto = asunto;
        this.cuerpo = cuerpo;
        this.fechaEnvio = LocalDateTime.now();
        this.enviado = false;
    }

    public void marcarEnviado() {
        this.enviado = true;
        this.error = null;
    }

    public void marcarError(String error) {
        this.enviado = false;
        this.error = error;
    }
}
