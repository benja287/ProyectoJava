package ar.edu.unlp.jyaa.grupo1.web.dto;

import ar.edu.unlp.jyaa.grupo1.modelo.ModalidadPresentacion;
import ar.edu.unlp.jyaa.grupo1.modelo.TipoActividad;
import java.time.LocalDateTime;

/** Presentación programada de un trabajo del autor en mesa temática o sesión de pósters. */
public record PresentacionAutorDTO(
    Long trabajoId,
    String trabajoTitulo,
    String ejeTematico,
    ModalidadPresentacion modalidad,
    Long actividadId,
    String actividadTitulo,
    String actividadCodigo,
    TipoActividad tipoActividad,
    String sala,
    LocalDateTime inicio,
    LocalDateTime fin,
    Integer numeroPanel) {}
