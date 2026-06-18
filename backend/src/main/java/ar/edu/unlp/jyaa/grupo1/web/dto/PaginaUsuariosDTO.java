package ar.edu.unlp.jyaa.grupo1.web.dto;

import java.util.List;

public record PaginaUsuariosDTO(
    List<UsuarioDTO> items, int page, int size, long total, int totalPages) {}
