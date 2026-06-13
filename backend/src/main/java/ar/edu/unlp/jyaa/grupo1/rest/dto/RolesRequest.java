package ar.edu.unlp.jyaa.grupo1.rest.dto;

import ar.edu.unlp.jyaa.grupo1.modelo.Rol;
import java.util.Set;

public record RolesRequest(Set<Rol> roles, Rol rolActual) {}
