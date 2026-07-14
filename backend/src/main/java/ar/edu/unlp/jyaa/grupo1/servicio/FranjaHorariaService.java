package ar.edu.unlp.jyaa.grupo1.servicio;

import ar.edu.unlp.jyaa.grupo1.dao.FranjaHorariaDAO;
import ar.edu.unlp.jyaa.grupo1.modelo.FranjaHoraria;
import ar.edu.unlp.jyaa.grupo1.rest.dto.FranjaHorariaRequest;
import ar.edu.unlp.jyaa.grupo1.util.FechasCongreso;
import ar.edu.unlp.jyaa.grupo1.web.dto.FranjaHorariaDTO;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import java.time.LocalTime;
import java.time.format.DateTimeParseException;
import java.util.List;

@RequestScoped
public class FranjaHorariaService {

  @Inject private FranjaHorariaDAO franjaHorariaDAO;

  public List<FranjaHorariaDTO> listarTodas() {
    return franjaHorariaDAO.listarTodas().stream().map(FranjaHorariaDTO::from).toList();
  }

  public List<FranjaHorariaDTO> listarActivas() {
    return franjaHorariaDAO.listarActivas().stream().map(FranjaHorariaDTO::from).toList();
  }

  public List<FranjaHorariaDTO> listarActivasPorDia(int diaCongreso) {
    return franjaHorariaDAO.listarActivasPorDia(diaCongreso).stream()
        .map(FranjaHorariaDTO::from)
        .toList();
  }

  public FranjaHorariaDTO obtener(Long id) {
    FranjaHoraria f = franjaHorariaDAO.recuperarPorId(id);
    if (f == null) {
      throw new NegocioException("Franja horaria no encontrada");
    }
    return FranjaHorariaDTO.from(f);
  }

  public FranjaHorariaDTO crear(FranjaHorariaRequest request) {
    FranjaHoraria f = new FranjaHoraria();
    aplicar(f, request, true);
    return FranjaHorariaDTO.from(franjaHorariaDAO.alta(f));
  }

  public FranjaHorariaDTO modificar(Long id, FranjaHorariaRequest request) {
    FranjaHoraria f = franjaHorariaDAO.recuperarPorId(id);
    if (f == null) {
      throw new NegocioException("Franja horaria no encontrada");
    }
    aplicar(f, request, false);
    return FranjaHorariaDTO.from(franjaHorariaDAO.modificar(f));
  }

  public void desactivar(Long id) {
    FranjaHoraria f = franjaHorariaDAO.recuperarPorId(id);
    if (f == null) {
      throw new NegocioException("Franja horaria no encontrada");
    }
    f.setActiva(false);
    franjaHorariaDAO.modificar(f);
  }

  private void aplicar(FranjaHoraria f, FranjaHorariaRequest request, boolean alta) {
    if (request == null) {
      throw new NegocioException("Datos de la franja requeridos");
    }
    if (request.diaCongreso() == null
        || request.diaCongreso() < 1
        || request.diaCongreso() > FechasCongreso.DIAS_CONGRESO) {
      throw new NegocioException(
          "Indicá el día del congreso (1 a " + FechasCongreso.DIAS_CONGRESO + ")");
    }
    LocalTime inicio = parseHora(request.horaInicio(), "hora de inicio");
    LocalTime fin = parseHora(request.horaFin(), "hora de fin");
    if (!fin.isAfter(inicio)) {
      throw new NegocioException("La hora de fin debe ser posterior a la de inicio");
    }
    f.setDiaCongreso(request.diaCongreso());
    f.setEtiqueta(
        request.etiqueta() == null || request.etiqueta().isBlank()
            ? null
            : request.etiqueta().trim());
    f.setHoraInicio(inicio);
    f.setHoraFin(fin);
    if (request.activa() != null) {
      f.setActiva(request.activa());
    } else if (alta) {
      f.setActiva(true);
    }
  }

  private static LocalTime parseHora(String valor, String etiquetaCampo) {
    if (valor == null || valor.isBlank()) {
      throw new NegocioException("Indicá la " + etiquetaCampo);
    }
    try {
      String v = valor.trim();
      if (v.length() == 5) {
        return LocalTime.parse(v);
      }
      return LocalTime.parse(v);
    } catch (DateTimeParseException e) {
      throw new NegocioException("Formato de " + etiquetaCampo + " inválido (usá HH:mm)");
    }
  }
}
