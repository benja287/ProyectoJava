package ar.edu.unlp.jyaa.grupo1.dao.filtro;

import ar.edu.unlp.jyaa.grupo1.modelo.TipoActividad;

/** Filtros opcionales para listado de actividades. */
public record ActividadFiltro(
    String codigo, TipoActividad tipoActividad, String titulo, String sala) {}
