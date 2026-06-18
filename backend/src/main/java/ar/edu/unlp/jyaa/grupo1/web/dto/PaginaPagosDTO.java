package ar.edu.unlp.jyaa.grupo1.web.dto;

import ar.edu.unlp.jyaa.grupo1.modelo.Pago;
import java.util.List;

public record PaginaPagosDTO(
    List<Pago> items, int page, int size, long total, int totalPages) {}
