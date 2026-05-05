package ar.unlp.agroecologia.modelo;

import java.util.UUID;

public class PlantillaEmail {
    private final UUID id;
    private String nombre;
    private String asunto;
    private String cuerpo;

    public PlantillaEmail(String nombre, String asunto, String cuerpo) {
        this.id = UUID.randomUUID();
        this.nombre = nombre;
        this.asunto = asunto;
        this.cuerpo = cuerpo;
    }

    public String renderizar(String variableTitulo, String variableEstado) {
        return cuerpo.replace("${titulo}", variableTitulo).replace("${estado}", variableEstado);
    }
}
