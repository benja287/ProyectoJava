package ar.edu.unlp.jyaa.grupo1.servlet;

import ar.edu.unlp.jyaa.grupo1.dao.UsuarioDAO;
import ar.edu.unlp.jyaa.grupo1.dao.UsuarioDAOImpl;
import ar.edu.unlp.jyaa.grupo1.modelo.Usuario;
import ar.edu.unlp.jyaa.grupo1.web.JsonResponse;
import ar.edu.unlp.jyaa.grupo1.web.dto.UsuarioDTO;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import java.io.IOException;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@WebServlet("/api/login")
public class LoginServlet extends HttpServlet {

  private final UsuarioDAO usuarioDAO = new UsuarioDAOImpl();

  @Override
  protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
    String body = req.getReader().lines().collect(Collectors.joining());
    JsonObject json = JsonParser.parseString(body).getAsJsonObject();
    String email = json.get("email").getAsString().trim().toLowerCase();
    String password = json.get("password").getAsString();

    Optional<Usuario> opt = usuarioDAO.buscarPorEmail(email);
    if (opt.isEmpty()) {
      JsonResponse.error(resp, 401, "Usuario no encontrado");
      return;
    }
    Usuario u = opt.get();
    if (!u.isActivo()) {
      JsonResponse.write(resp, 403, Map.of("accountDisabled", true));
      return;
    }
    if (!u.getPassword().equals(password)) {
      JsonResponse.error(resp, 401, "Credenciales invalidas");
      return;
    }

    HttpSession session = req.getSession(true);
    session.setAttribute("usuarioId", u.getId());
    session.setAttribute("usuarioEmail", u.getEmail());

    boolean needsRoleSelection = u.getRoles().size() > 1 && u.getRolActual() == null;
    JsonResponse.write(
        resp,
        200,
        Map.of(
            "success", true,
            "needsRoleSelection", needsRoleSelection,
            "user", UsuarioDTO.from(u)));
  }
}
