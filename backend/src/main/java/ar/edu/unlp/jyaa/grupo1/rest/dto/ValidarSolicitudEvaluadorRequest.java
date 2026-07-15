package ar.edu.unlp.jyaa.grupo1.rest.dto;

public record ValidarSolicitudEvaluadorRequest(
    boolean aprobar, String motivoRechazo, String ejeAsignacion, boolean enviarInvitacionTaller) {}
