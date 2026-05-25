package ar.edu.unlp.jyaa.grupo1.servlet;

import ar.edu.unlp.jyaa.grupo1.test.PersistenciaAbmTests;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;

/**
 * Servlet de casos de prueba ABM sobre los DAOs (consigna tercera entrega).
 *
 * <p>URL: GET /test-persistencia
 */
@WebServlet("/test-persistencia")
public class PersistenciaTestServlet extends HttpServlet {

  @Override
  protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
    resp.setCharacterEncoding(StandardCharsets.UTF_8.name());
    resp.setContentType("text/html;charset=UTF-8");

    PersistenciaAbmTests.Resultado resultado = new PersistenciaAbmTests().ejecutarTodos();

    resp.getWriter().write("<!DOCTYPE html><html><head><meta charset='UTF-8'/>");
    resp.getWriter().write("<title>Tests persistencia — Grupo 1</title>");
    resp.getWriter().write("<style>body{font-family:monospace;padding:1rem;} .ok{color:green;} .fail{color:red;}</style>");
    resp.getWriter().write("</head><body>");
    resp.getWriter().write("<h1>Pruebas ABM — DAO + JPA/Hibernate</h1>");
    resp.getWriter()
        .write(
            "<p class='"
                + (resultado.exito() ? "ok" : "fail")
                + "'><strong>"
                + (resultado.exito() ? "TODOS LOS TESTS PASARON" : "HAY TESTS FALLIDOS")
                + "</strong></p>");
    resp.getWriter().write("<pre>");
    resp.getWriter().write(escapeHtml(resultado.detalle()));
    resp.getWriter().write("</pre>");
    resp.getWriter().write("<p><a href='index.html'>Volver al inicio</a></p>");
    resp.getWriter().write("</body></html>");
  }

  private static String escapeHtml(String s) {
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
  }
}
