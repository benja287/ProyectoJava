package ar.edu.unlp.jyaa.grupo1.web;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.regex.Pattern;

/**
 * Evita que el navegador cachee el shell de la SPA (index.html y rutas sin extensión).
 * Los bundles con hash (main-XXXX.js) sí pueden cachearse de forma larga e inmutable.
 */
public class StaticCacheFilter implements Filter {

  private static final Pattern HASHED_ASSET =
      Pattern.compile(".*/[a-zA-Z0-9_.-]+-[A-Za-z0-9]{8}\\.(js|css)$");

  @Override
  public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
      throws IOException, ServletException {
    HttpServletRequest req = (HttpServletRequest) request;
    HttpServletResponse res = (HttpServletResponse) response;

    if (!req.getRequestURI().startsWith(req.getContextPath() + "/api")) {
      String path = req.getRequestURI();
      if (isHashedAsset(path)) {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      } else if (isSpaShell(path)) {
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        res.setHeader("Pragma", "no-cache");
        res.setDateHeader("Expires", 0);
      }
    }

    chain.doFilter(request, response);
  }

  private boolean isHashedAsset(String path) {
    return HASHED_ASSET.matcher(path).matches();
  }

  private boolean isSpaShell(String path) {
    if (path.endsWith("/index.html")) {
      return true;
    }
    if (path.endsWith("/version.json")) {
      return true;
    }
    int lastSlash = path.lastIndexOf('/');
    String file = lastSlash >= 0 ? path.substring(lastSlash + 1) : path;
    return !file.contains(".");
  }
}
