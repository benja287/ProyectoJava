package ar.unlp.agroecologia.modelo;

import java.time.LocalDateTime;
import java.util.UUID;

public class Circular {
    private final UUID id;
    private String titulo;
    private String contenido;
    private boolean publicada;
    private LocalDateTime fechaPublicacion;

    public Circular(String titulo, String contenido) {
        this.id = UUID.randomUUID();
        this.titulo = titulo;
        this.contenido = contenido;
        this.publicada = false;
    }

    public void publicar() {
        this.publicada = true;
        this.fechaPublicacion = LocalDateTime.now();
    }

    public void despublicar() {
        this.publicada = false;
    }
}
