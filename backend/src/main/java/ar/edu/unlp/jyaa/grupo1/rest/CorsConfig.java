package ar.edu.unlp.jyaa.grupo1.rest;

import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

/** Orígenes permitidos para CORS (desarrollo: Angular en localhost:4200). */
public final class CorsConfig {

  private static final Set<String> DEFAULT_ORIGINS = Set.of("http://localhost:4200");

  private CorsConfig() {}

  public static boolean isAllowed(String origin) {
    if (origin == null || origin.isBlank()) {
      return false;
    }
    return allowedOrigins().contains(origin.trim());
  }

  public static Set<String> allowedOrigins() {
    String env = System.getenv("CORS_ALLOWED_ORIGINS");
    if (env != null && !env.isBlank()) {
      return parseList(env);
    }
    String property = System.getProperty("cors.allowed.origins");
    if (property != null && !property.isBlank()) {
      return parseList(property);
    }
    return DEFAULT_ORIGINS;
  }

  private static Set<String> parseList(String value) {
    return Arrays.stream(value.split(","))
        .map(String::trim)
        .filter(s -> !s.isEmpty())
        .collect(Collectors.toUnmodifiableSet());
  }
}
