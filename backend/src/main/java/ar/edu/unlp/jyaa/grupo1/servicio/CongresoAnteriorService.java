package ar.edu.unlp.jyaa.grupo1.servicio;

import ar.edu.unlp.jyaa.grupo1.dao.CongresoAnteriorDAO;
import ar.edu.unlp.jyaa.grupo1.web.dto.CongresoAnteriorDTO;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import java.util.List;

@RequestScoped
public class CongresoAnteriorService {

  @Inject private CongresoAnteriorDAO congresoAnteriorDAO;

  public List<CongresoAnteriorDTO> listar() {
    return congresoAnteriorDAO.listarOrdenados().stream().map(CongresoAnteriorDTO::from).toList();
  }
}
