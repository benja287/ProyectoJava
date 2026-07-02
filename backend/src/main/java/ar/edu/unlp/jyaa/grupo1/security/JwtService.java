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

  private static final String ISSUER = "jyaa-grupo1";
  private static final long TTL_SECONDS = 4 * 60 * 60;

  private SecretKey signingKey() {
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
    Instant now = Instant.now();
    List<String> roles = usuario.getRoles().stream().map(Rol::name).toList();
    String rolActual = usuario.getRolActual() != null ? usuario.getRolActual().name() : null;
    return Jwts.builder()
        .issuer(ISSUER)
        .subject(String.valueOf(usuario.getId()))
        .claim("email", usuario.getEmail())
        .claim("roles", roles)
        .claim("rolActual", rolActual)
        .issuedAt(Date.from(now))
        .expiration(Date.from(now.plusSeconds(TTL_SECONDS)))
        .signWith(signingKey())
        .compact();
  }

  public Claims parse(String token) {
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
