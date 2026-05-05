package ar.unlp.agroecologia.modelo;

import java.util.Collections;
import java.util.HashSet;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

public class Usuario {
    private final UUID id;
    private String nombre;
    private String apellido;
    private String email;
    private boolean activo;
    private final Set<Rol> roles;

    public Usuario(String nombre, String apellido, String email) {
        this.id = UUID.randomUUID();
        this.nombre = Objects.requireNonNull(nombre);
        this.apellido = Objects.requireNonNull(apellido);
        this.email = Objects.requireNonNull(email);
        this.activo = true;
        this.roles = new HashSet<>();
        this.roles.add(Rol.PARTICIPANTE);
    }

    public UUID getId() {
        return id;
    }

    public String getNombre() {
        return nombre;
    }

    public String getApellido() {
        return apellido;
    }

    public String getEmail() {
        return email;
    }

    public boolean isActivo() {
        return activo;
    }

    public Set<Rol> getRoles() {
        return Collections.unmodifiableSet(roles);
    }

    public void desactivar() {
        this.activo = false;
    }

    public void activar() {
        this.activo = true;
    }

    public void agregarRol(Rol rol) {
        this.roles.add(Objects.requireNonNull(rol));
    }

    public void quitarRol(Rol rol) {
        if (rol == Rol.PARTICIPANTE) {
            throw new IllegalArgumentException("No se puede quitar el rol base PARTICIPANTE");
        }
        this.roles.remove(rol);
    }

    public boolean tieneRol(Rol rol) {
        return roles.contains(rol);
    }
}
