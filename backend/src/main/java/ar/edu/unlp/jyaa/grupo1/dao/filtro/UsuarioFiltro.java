package ar.edu.unlp.jyaa.grupo1.dao.filtro;

/** Filtros opcionales para listado de usuarios (LIKE en apellido, nombre, email). */
public record UsuarioFiltro(String apellido, String nombre, String email) {}
