package ar.edu.unlp.jyaa.grupo1.dao.filtro;

import ar.edu.unlp.jyaa.grupo1.modelo.EstadoTrabajo;
import ar.edu.unlp.jyaa.grupo1.modelo.ModalidadPresentacion;

/** Filtros opcionales para listado de trabajos. */
public record TrabajoFiltro(
    String titulo,
    String resumen,
    String ejeTematico,
    EstadoTrabajo estado,
    ModalidadPresentacion modalidad,
    Long autorId) {}
