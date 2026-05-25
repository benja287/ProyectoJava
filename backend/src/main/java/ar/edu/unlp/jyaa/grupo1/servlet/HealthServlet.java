package ar.edu.unlp.jyaa.grupo1.servlet;

import ar.edu.unlp.jyaa.grupo1.web.JsonResponse;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Map;

@WebServlet("/api/health")
public class HealthServlet extends HttpServlet {

  @Override
  protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
    Object jpaReady = getServletContext().getAttribute("jyaa.jpa.ready");
    JsonResponse.write(
        resp,
        200,
        Map.of(
            "status", "ok",
            "grupo", 1,
            "jpa", Boolean.TRUE.equals(jpaReady),
            "app", "Congreso Agroecologia - Backend JYAA 2026"));
  }
}
