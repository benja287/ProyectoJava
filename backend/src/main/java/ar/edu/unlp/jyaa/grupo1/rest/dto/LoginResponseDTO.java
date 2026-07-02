package ar.edu.unlp.jyaa.grupo1.rest.dto;

import ar.edu.unlp.jyaa.grupo1.web.dto.UsuarioDTO;

/** Respuesta de POST /api/login — token JWT + datos del usuario (sin password). */
public record LoginResponseDTO(
    String token, String tokenType, long expiresIn, UsuarioDTO usuario) {}
