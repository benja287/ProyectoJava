package ar.unlp.agroecologia.modelo;

import java.time.LocalDateTime;
import java.util.UUID;

public class Anuncio {
    private final UUID id;
    private final String titulo;
    private final String mensaje;
    private final LocalDateTime fechaCreacion;
    private boolean activo;

    public Anuncio(String titulo, String mensaje) {
        this.id = UUID.randomUUID();
        this.titulo = titulo;
        this.mensaje = mensaje;
        this.fechaCreacion = LocalDateTime.now();
        this.activo = true;
    }

    public void desactivar() {
        this.activo = false;
    }
}
