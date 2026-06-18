package ar.edu.unlp.jyaa.grupo1.web.dto;

import ar.edu.unlp.jyaa.grupo1.modelo.Circular;
import java.util.List;

public record PaginaCircularesDTO(
    List<Circular> items, int page, int size, long total, int totalPages) {}
