package ar.edu.unlp.jyaa.grupo1.dao.filtro;

import ar.edu.unlp.jyaa.grupo1.modelo.EstadoInscripcion;

/** Filtros opcionales para listado de inscripciones. */
public record InscripcionFiltro(
    EstadoInscripcion estado, String categoria, Long usuarioId) {}
