package ar.edu.unlp.jyaa.grupo1.web;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;

public final class JsonResponse {

  private static final Gson GSON =
      new GsonBuilder().setDateFormat("yyyy-MM-dd'T'HH:mm:ss").create();

  private JsonResponse() {}

  public static void write(HttpServletResponse resp, int status, Object body) throws IOException {
    resp.setStatus(status);
    resp.setCharacterEncoding(StandardCharsets.UTF_8.name());
    resp.setContentType("application/json");
    resp.getWriter().write(GSON.toJson(body));
  }

  public static void error(HttpServletResponse resp, int status, String message)
      throws IOException {
    write(resp, status, new ErrorBody(message));
  }

  public record ErrorBody(String error) {}
}
