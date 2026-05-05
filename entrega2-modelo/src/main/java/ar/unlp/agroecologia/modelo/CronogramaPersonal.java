package ar.unlp.agroecologia.modelo;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class CronogramaPersonal {
    private final List<Actividad> actividades;

    public CronogramaPersonal() {
        this.actividades = new ArrayList<>();
    }

    public List<Actividad> getActividades() {
        return Collections.unmodifiableList(actividades);
    }

    public void agregarActividad(Actividad actividad) {
        boolean hayConflicto = actividades.stream().anyMatch(a -> a.seSuperponeCon(actividad));
        if (hayConflicto) {
            throw new IllegalArgumentException("La actividad se superpone con otra en el cronograma personal");
        }
        actividades.add(actividad);
    }

    public void quitarActividad(Actividad actividad) {
        actividades.remove(actividad);
    }
}
