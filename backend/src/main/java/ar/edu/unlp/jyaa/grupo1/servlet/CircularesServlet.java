package ar.edu.unlp.jyaa.grupo1.servlet;

import ar.edu.unlp.jyaa.grupo1.dao.CircularDAO;
import ar.edu.unlp.jyaa.grupo1.dao.CircularDAOImpl;
import ar.edu.unlp.jyaa.grupo1.modelo.Circular;
import ar.edu.unlp.jyaa.grupo1.web.JsonResponse;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import java.util.Map;

@WebServlet("/api/circulares")
public class CircularesServlet extends HttpServlet {

  private final CircularDAO circularDAO = new CircularDAOImpl();

  @Override
  protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
    List<Circular> list = circularDAO.listarPublicadas();
    JsonResponse.write(
        resp,
        200,
        list.stream()
            .map(
                c ->
                    Map.of(
                        "id", c.getId(),
                        "titulo", c.getTitulo(),
                        "contenido", c.getContenido(),
                        "publicada", c.isPublicada(),
                        "fechaPublicacion",
                            c.getFechaPublicacion() != null
                                ? c.getFechaPublicacion().toString()
                                : ""))
            .toList());
  }
}
