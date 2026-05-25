package ar.edu.unlp.jyaa.grupo1.servlet;

import ar.edu.unlp.jyaa.grupo1.dao.TrabajoDAO;
import ar.edu.unlp.jyaa.grupo1.dao.TrabajoDAOImpl;
import ar.edu.unlp.jyaa.grupo1.dao.UsuarioDAO;
import ar.edu.unlp.jyaa.grupo1.dao.UsuarioDAOImpl;
import ar.edu.unlp.jyaa.grupo1.modelo.EstadoTrabajo;
import ar.edu.unlp.jyaa.grupo1.modelo.TipoTrabajo;
import ar.edu.unlp.jyaa.grupo1.modelo.Trabajo;
import ar.edu.unlp.jyaa.grupo1.modelo.Usuario;
import ar.edu.unlp.jyaa.grupo1.web.JsonResponse;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@WebServlet("/api/trabajos")
public class TrabajosServlet extends HttpServlet {

  private final TrabajoDAO trabajoDAO = new TrabajoDAOImpl();
  private final UsuarioDAO usuarioDAO = new UsuarioDAOImpl();

  @Override
  protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
    String autorId = req.getParameter("autorId");
    List<Trabajo> trabajos =
        autorId != null
            ? trabajoDAO.listarPorAutor(Long.parseLong(autorId))
            : trabajoDAO.listarTodos();
    JsonResponse.write(resp, 200, trabajos.stream().map(this::toMap).toList());
  }

  @Override
  protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
    String body = req.getReader().lines().collect(Collectors.joining());
    JsonObject json = JsonParser.parseString(body).getAsJsonObject();
    Long autorId = json.get("autorId").getAsLong();

    Usuario autor = usuarioDAO.recuperarPorId(autorId);
    if (autor == null) {
      JsonResponse.error(resp, 404, "Autor inexistente");
      return;
    }

    Trabajo t = new Trabajo();
    t.setTitulo(json.get("titulo").getAsString());
    if (json.has("resumen")) {
      t.setResumen(json.get("resumen").getAsString());
    }
    t.setEjeTematico(json.get("ejeTematico").getAsString());
    String tipoStr = json.has("tipo") ? json.get("tipo").getAsString() : "TRABAJO_CIENTIFICO";
    t.setTipo(TipoTrabajo.valueOf(tipoStr));
    t.setEstado(EstadoTrabajo.ENVIADO);
    t.setFechaCreacion(LocalDate.now());
    if (json.has("documentoUrl")) {
      t.setDocumentoUrl(json.get("documentoUrl").getAsString());
    }
    t.setAutor(autor);

    trabajoDAO.alta(t);
    JsonResponse.write(resp, 201, toMap(t));
  }

  private Map<String, Object> toMap(Trabajo t) {
    return Map.of(
        "id", t.getId(),
        "titulo", t.getTitulo(),
        "resumen", t.getResumen() != null ? t.getResumen() : "",
        "ejeTematico", t.getEjeTematico() != null ? t.getEjeTematico() : "",
        "tipo", t.getTipo().name(),
        "estado", t.getEstado().name(),
        "fechaCreacion", t.getFechaCreacion() != null ? t.getFechaCreacion().toString() : "",
        "autorId", t.getAutor() != null ? t.getAutor().getId() : null);
  }
}
