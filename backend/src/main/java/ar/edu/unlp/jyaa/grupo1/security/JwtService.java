package ar.edu.unlp.jyaa.grupo1.security;

import ar.edu.unlp.jyaa.grupo1.modelo.Rol;
import ar.edu.unlp.jyaa.grupo1.modelo.Usuario;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.enterprise.context.ApplicationScoped;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.List;
import javax.crypto.SecretKey;

@ApplicationScoped
public class JwtService {

  /**
   * Identificador del emisor del token.
   *
   * <p>Se valida al parsear el token para evitar aceptar tokens emitidos por otra app.
   */
  private static final String ISSUER = "jyaa-grupo1";

  /**
   * Tiempo de vida del JWT (en segundos).
   *
   * <p>El frontend usa esta ventana para detectar sesión expirada y forzar re-login.
   */
  private static final long TTL_SECONDS = 4 * 60 * 60;

  private SecretKey signingKey() {
    /**
     * Clave HMAC simétrica usada para firmar y verificar tokens.
     *
     * <p>En producción debe venir por variable de entorno. El valor por defecto es solo para
     * desarrollo local.
     *
     * <p>Requisito de HS256: al menos 32 bytes. Si es más corta, se rellena para no fallar en
     * desarrollo (no recomendado para producción).
     */
    String secret =
        System.getenv().getOrDefault(
            "JYAA_JWT_SECRET", "jyaa2026-grupo1-dev-secret-min-32-chars!!");
    byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
    if (keyBytes.length < 32) {
      byte[] padded = new byte[32];
      System.arraycopy(keyBytes, 0, padded, 0, Math.min(keyBytes.length, 32));
      keyBytes = padded;
    }
    return Keys.hmacShaKeyFor(keyBytes);
  }

  public long ttlSeconds() {
    return TTL_SECONDS;
  }

  public String generate(Usuario usuario) {
    /**
     * Construye un JWT firmado que el frontend enviará como:
     *
     * <pre>
     * Authorization: Bearer &lt;token&gt;
     * </pre>
     *
     * El filtro {@code JwtAuthFilter} validará el token en cada request protegida.
     */
    Instant now = Instant.now();
    List<String> roles = usuario.getRoles().stream().map(Rol::name).toList();
    String rolActual = usuario.getRolActual() != null ? usuario.getRolActual().name() : null;
    return Jwts.builder()
        .issuer(ISSUER)
        .subject(String.valueOf(usuario.getId()))
        // Claims "de conveniencia" para el cliente (sin password).
        // Nota: además el backend consulta en BD si la cuenta sigue activa (JwtAuthFilter).
        .claim("email", usuario.getEmail())
        .claim("roles", roles)
        .claim("rolActual", rolActual)
        .issuedAt(Date.from(now))
        .expiration(Date.from(now.plusSeconds(TTL_SECONDS)))
        .signWith(signingKey())
        .compact();
  }

  public Claims parse(String token) {
    /**
     * Verifica firma + issuer + expiración.
     *
     * <p>Si el token es inválido o expiró, se lanza {@link JwtException} con un mensaje claro para el
     * cliente.
     */
    try {
      return Jwts.parser()
          .verifyWith(signingKey())
          .requireIssuer(ISSUER)
          .build()
          .parseSignedClaims(token)
          .getPayload();
    } catch (ExpiredJwtException e) {
      throw new JwtException("Token expirado");
    } catch (Exception e) {
      throw new JwtException("Token inválido");
    }
  }
}
