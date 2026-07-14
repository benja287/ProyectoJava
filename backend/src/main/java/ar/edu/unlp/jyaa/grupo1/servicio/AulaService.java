package ar.edu.unlp.jyaa.grupo1.servicio;

import ar.edu.unlp.jyaa.grupo1.dao.AulaDAO;
import ar.edu.unlp.jyaa.grupo1.dao.CongresoDAO;
import ar.edu.unlp.jyaa.grupo1.modelo.Aula;
import ar.edu.unlp.jyaa.grupo1.modelo.Congreso;
import ar.edu.unlp.jyaa.grupo1.rest.dto.AulaRequest;
import ar.edu.unlp.jyaa.grupo1.util.MapaSedeUtil;
import ar.edu.unlp.jyaa.grupo1.web.dto.AulaDTO;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import java.util.List;

@RequestScoped
public class AulaService {

  @Inject private AulaDAO aulaDAO;
  @Inject private CongresoDAO congresoDAO;

  public List<AulaDTO> listarTodas() {
    return aulaDAO.listarTodas().stream().map(AulaDTO::from).toList();
  }

  public List<AulaDTO> listarActivas() {
    return aulaDAO.listarActivas().stream().map(AulaDTO::from).toList();
  }

  public AulaDTO obtener(Long id) {
    Aula aula = aulaDAO.recuperarPorId(id);
    if (aula == null) {
      throw new NegocioException("Aula no encontrada");
    }
    return AulaDTO.from(aula);
  }

  public AulaDTO crear(AulaRequest request) {
    Aula aula = new Aula();
    aplicar(aula, request, true);
    return AulaDTO.from(aulaDAO.alta(aula));
  }

  public AulaDTO modificar(Long id, AulaRequest request) {
    Aula aula = aulaDAO.recuperarPorId(id);
    if (aula == null) {
      throw new NegocioException("Aula no encontrada");
    }
    aplicar(aula, request, false);
    return AulaDTO.from(aulaDAO.modificar(aula));
  }

  public void eliminar(Long id) {
    Aula aula = aulaDAO.recuperarPorId(id);
    if (aula == null) {
      throw new NegocioException("Aula no encontrada");
    }
    // Baja lógica: no borramos filas usadas por actividades.
    aula.setActiva(false);
    aulaDAO.modificar(aula);
  }

  private void aplicar(Aula aula, AulaRequest request, boolean alta) {
    if (request == null) {
      throw new NegocioException("Datos del aula requeridos");
    }
    if (request.nombre() == null || request.nombre().isBlank()) {
      throw new NegocioException("Indicá el nombre del aula");
    }
    aula.setNombre(request.nombre().trim());
    if (request.capacidad() != null && request.capacidad() < 1) {
      throw new NegocioException("La capacidad debe ser al menos 1 (o vacía)");
    }
    aula.setCapacidad(request.capacidad());
    aula.setUbicacion(
        request.ubicacion() == null || request.ubicacion().isBlank()
            ? null
            : request.ubicacion().trim());
    aplicarCoordenadas(aula, request.latitud(), request.longitud());
    if (request.activa() != null) {
      aula.setActiva(request.activa());
    } else if (alta) {
      aula.setActiva(true);
    }
  }

  private void aplicarCoordenadas(Aula aula, Double latitud, Double longitud) {
    if (latitud == null && longitud == null) {
      aula.setLatitud(null);
      aula.setLongitud(null);
      return;
    }
    if (latitud == null || longitud == null) {
      throw new NegocioException("Para ubicar el aula en el mapa indicá latitud y longitud.");
    }
    Congreso congreso = congresoDAO.obtenerPrincipal();
    Double centroLat = congreso.getMapaLatitud();
    Double centroLng = congreso.getMapaLongitud();
    if (centroLat == null || centroLng == null) {
      throw new NegocioException(
          "Definí primero la ubicación del congreso en el mapa (Datos del congreso).");
    }
    if (!MapaSedeUtil.puntoEnRango(latitud, longitud, centroLat, centroLng)) {
      throw new NegocioException(
          "La ubicación del aula debe estar dentro del rango del mapa del congreso.");
    }
    aula.setLatitud(latitud);
    aula.setLongitud(longitud);
  }
}
