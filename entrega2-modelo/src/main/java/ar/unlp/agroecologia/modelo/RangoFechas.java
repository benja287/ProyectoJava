package ar.unlp.agroecologia.modelo;

import java.time.LocalDate;
import java.util.Objects;

public class RangoFechas {
    private final LocalDate desde;
    private final LocalDate hasta;

    public RangoFechas(LocalDate desde, LocalDate hasta) {
        this.desde = Objects.requireNonNull(desde);
        this.hasta = Objects.requireNonNull(hasta);
        if (desde.isAfter(hasta)) {
            throw new IllegalArgumentException("La fecha desde no puede ser posterior a la fecha hasta");
        }
    }

    public boolean contiene(LocalDate fecha) {
        return (fecha.isEqual(desde) || fecha.isAfter(desde)) && (fecha.isEqual(hasta) || fecha.isBefore(hasta));
    }
}
