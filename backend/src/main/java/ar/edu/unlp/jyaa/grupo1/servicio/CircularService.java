package ar.edu.unlp.jyaa.grupo1.servicio;

import ar.edu.unlp.jyaa.grupo1.dao.CircularDAO;
import ar.edu.unlp.jyaa.grupo1.modelo.Circular;
import ar.edu.unlp.jyaa.grupo1.web.dto.PaginaCircularesDTO;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import java.util.List;

@RequestScoped
public class CircularService {

  private static final int PAGE_DEFAULT = 1;
  private static final int SIZE_DEFAULT = 20;
  private static final int SIZE_MAX = 100;

  @Inject private CircularDAO circularDAO;

  public PaginaCircularesDTO listarPublicadas(int page, int size) {
    int safePage = Math.max(PAGE_DEFAULT, page);
    int safeSize = Math.min(Math.max(1, size), SIZE_MAX);
    int offset = (safePage - 1) * safeSize;

    long total = circularDAO.contarPublicadas();
    List<Circular> items = circularDAO.listarPublicadasPaginado(offset, safeSize);
    int totalPages = total == 0 ? 0 : (int) Math.ceil((double) total / safeSize);

    return new PaginaCircularesDTO(items, safePage, safeSize, total, totalPages);
  }
}
