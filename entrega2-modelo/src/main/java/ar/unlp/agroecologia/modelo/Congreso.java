package ar.unlp.agroecologia.modelo;

import java.time.LocalDate;
import java.util.EnumMap;
import java.util.Map;
import java.util.Objects;

public class Congreso {
    private String nombre;
    private String edicion;
    private final Map<EtapaProceso, RangoFechas> etapas;

    public Congreso(String nombre, String edicion) {
        this.nombre = Objects.requireNonNull(nombre);
        this.edicion = Objects.requireNonNull(edicion);
        this.etapas = new EnumMap<>(EtapaProceso.class);
    }

    public void definirEtapa(EtapaProceso etapa, LocalDate desde, LocalDate hasta) {
        this.etapas.put(Objects.requireNonNull(etapa), new RangoFechas(desde, hasta));
    }

    public boolean estaEtapaHabilitada(EtapaProceso etapa, LocalDate fecha) {
        RangoFechas rango = this.etapas.get(etapa);
        return rango != null && rango.contiene(fecha);
    }
}
