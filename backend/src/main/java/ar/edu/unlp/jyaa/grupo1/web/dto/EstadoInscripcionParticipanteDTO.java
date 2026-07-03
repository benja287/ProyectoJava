package ar.edu.unlp.jyaa.grupo1.web.dto;

import ar.edu.unlp.jyaa.grupo1.modelo.InscripcionCongreso;

public record EstadoInscripcionParticipanteDTO(
    InscripcionCongresoDTO inscripcion,
    String categoriaPreferida,
    boolean puedeInscribirse,
    boolean esAsistente) {

  public static EstadoInscripcionParticipanteDTO of(
      InscripcionCongreso inscripcion, String categoriaPreferida, boolean esAsistente) {
    InscripcionCongresoDTO dto = inscripcion != null ? InscripcionCongresoDTO.from(inscripcion) : null;
    boolean puede =
        inscripcion == null
            || inscripcion.getEstado() == ar.edu.unlp.jyaa.grupo1.modelo.EstadoInscripcion.RECHAZADA;
    return new EstadoInscripcionParticipanteDTO(dto, categoriaPreferida, puede, esAsistente);
  }
}
