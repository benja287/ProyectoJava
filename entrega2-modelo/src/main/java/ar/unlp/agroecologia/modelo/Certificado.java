package ar.unlp.agroecologia.modelo;

import java.time.LocalDateTime;
import java.util.UUID;

public class Certificado {
    private final UUID id;
    private final Usuario destinatario;
    private final Rol rolCertificado;
    private final String archivoUrl;
    private final LocalDateTime fechaEmision;

    public Certificado(Usuario destinatario, Rol rolCertificado, String archivoUrl) {
        this.id = UUID.randomUUID();
        this.destinatario = destinatario;
        this.rolCertificado = rolCertificado;
        this.archivoUrl = archivoUrl;
        this.fechaEmision = LocalDateTime.now();
    }
}
