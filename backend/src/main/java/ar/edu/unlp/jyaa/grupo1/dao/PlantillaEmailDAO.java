package ar.edu.unlp.jyaa.grupo1.dao;

import ar.edu.unlp.jyaa.grupo1.modelo.PlantillaEmail;
import java.util.Optional;

public interface PlantillaEmailDAO extends GenericDAO<PlantillaEmail> {

  Optional<PlantillaEmail> buscarPorNombre(String nombre);
}
