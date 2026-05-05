package ar.unlp.agroecologia.modelo;

import java.time.LocalDateTime;
import java.util.Objects;
import java.util.UUID;

public class Actividad {
    private final UUID id;
    private String titulo;
    private String tipo;
    private String aula;
    private LocalDateTime inicio;
    private LocalDateTime fin;

    public Actividad(String titulo, String tipo, String aula, LocalDateTime inicio, LocalDateTime fin) {
        this.id = UUID.randomUUID();
        this.titulo = Objects.requireNonNull(titulo);
        this.tipo = Objects.requireNonNull(tipo);
        this.aula = Objects.requireNonNull(aula);
        this.inicio = Objects.requireNonNull(inicio);
        this.fin = Objects.requireNonNull(fin);
        validarRangoHorario();
    }

    public UUID getId() {
        return id;
    }

    public String getAula() {
        return aula;
    }

    public LocalDateTime getInicio() {
        return inicio;
    }

    public LocalDateTime getFin() {
        return fin;
    }

    public void reprogramar(LocalDateTime nuevoInicio, LocalDateTime nuevoFin, String nuevaAula) {
        this.inicio = Objects.requireNonNull(nuevoInicio);
        this.fin = Objects.requireNonNull(nuevoFin);
        this.aula = Objects.requireNonNull(nuevaAula);
        validarRangoHorario();
    }

    public boolean seSuperponeCon(Actividad otra) {
        return this.inicio.isBefore(otra.fin) && otra.inicio.isBefore(this.fin);
    }

    private void validarRangoHorario() {
        if (!inicio.isBefore(fin)) {
            throw new IllegalArgumentException("La hora de fin debe ser posterior a la hora de inicio");
        }
    }
}
