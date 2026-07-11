package ar.edu.unlp.jyaa.grupo1.servicio;

import ar.edu.unlp.jyaa.grupo1.config.JpaUtil;
import ar.edu.unlp.jyaa.grupo1.modelo.Congreso;
import ar.edu.unlp.jyaa.grupo1.modelo.Rol;
import ar.edu.unlp.jyaa.grupo1.rest.dto.CongresoConfigUpdateRequest;
import ar.edu.unlp.jyaa.grupo1.web.dto.CongresoConfigDTO;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Objects;

@RequestScoped
public class CongresoService {

  private static final DateTimeFormatter FECHA_ES = DateTimeFormatter.ofPattern("dd/MM/yyyy");
  private static final int DIAS_CONGRESO = 3;

  @Inject private NotificacionService notificacionService;

  public CongresoConfigDTO obtenerConfig() {
    return JpaUtil.ejecutarEnTransaccionReturning(this::leerConfigDesdeEm);
  }

  public boolean isProgramaPublicado() {
    return obtenerConfig().programaPublicado();
  }

  public CongresoConfigDTO actualizarConfig(CongresoConfigUpdateRequest request) {
    SnapshotAntes antes = new SnapshotAntes();
    CongresoConfigDTO dto =
        JpaUtil.ejecutarEnTransaccionReturning(
            em -> {
              Congreso congreso = resolverCongresoPrincipal(em);
              antes.capturar(congreso);

              if (request.programaPublicado() != null) {
                congreso.setProgramaPublicado(request.programaPublicado());
              }
              if (request.certificadosDisponiblesDesde() != null) {
                congreso.setCertificadosDisponiblesDesde(
                    parseFechaOpcional(request.certificadosDisponiblesDesde()));
              }
              if (request.envioTrabajosHasta() != null) {
                congreso.setEnvioTrabajosHasta(parseFechaOpcional(request.envioTrabajosHasta()));
              }
              if (request.congresoDesde() != null || request.congresoHasta() != null) {
                LocalDate desde =
                    request.congresoDesde() != null
                        ? parseFechaOpcional(request.congresoDesde())
                        : congreso.getCongresoDesde();
                LocalDate hasta =
                    request.congresoHasta() != null
                        ? parseFechaOpcional(request.congresoHasta())
                        : congreso.getCongresoHasta();
                if (desde != null && hasta == null) {
                  hasta = desde.plusDays(DIAS_CONGRESO - 1L);
                }
                congreso.setCongresoDesde(desde);
                congreso.setCongresoHasta(hasta);
              }
              if (request.inscripcionesDesde() != null) {
                congreso.setInscripcionesDesde(parseFechaOpcional(request.inscripcionesDesde()));
              }
              if (request.inscripcionesHasta() != null) {
                congreso.setInscripcionesHasta(parseFechaOpcional(request.inscripcionesHasta()));
              }
              if (request.evaluacionHasta() != null) {
                congreso.setEvaluacionHasta(parseFechaOpcional(request.evaluacionHasta()));
              }

              boolean tocaCongreso =
                  request.congresoDesde() != null || request.congresoHasta() != null;
              boolean tocaInsc =
                  request.inscripcionesDesde() != null || request.inscripcionesHasta() != null;
              boolean tocaEval = request.evaluacionHasta() != null;
              boolean tocaEnvio = request.envioTrabajosHasta() != null;
              if (tocaCongreso || tocaInsc || tocaEval) {
                exigirMotivo(request.motivo());
              }

              validarVentanas(congreso);
              em.flush();
              return CongresoConfigDTO.from(congreso);
            });

    notificarCambiosVentanas(antes, dto, request);
    return dto;
  }

  private void notificarCambiosVentanas(
      SnapshotAntes antes, CongresoConfigDTO despues, CongresoConfigUpdateRequest request) {
    String motivo =
        request.motivo() != null && !request.motivo().isBlank()
            ? request.motivo().trim()
            : "Actualización de la fecha límite de envío de trabajos.";

    boolean cambioCongreso =
        !Objects.equals(antes.congresoDesde, despues.congresoDesde())
            || !Objects.equals(antes.congresoHasta, despues.congresoHasta());
    boolean cambioInsc =
        !Objects.equals(antes.inscripcionesDesde, despues.inscripcionesDesde())
            || !Objects.equals(antes.inscripcionesHasta, despues.inscripcionesHasta());
    boolean cambioEnvio = !Objects.equals(antes.envioTrabajosHasta, despues.envioTrabajosHasta());
    boolean cambioEval = !Objects.equals(antes.evaluacionHasta, despues.evaluacionHasta());

    if (cambioCongreso) {
      String cuerpo =
          "Se actualizaron las fechas del congreso: "
              + rangoTexto(despues.congresoDesde(), despues.congresoHasta())
              + ". Motivo: "
              + motivo
              + ". Las actividades del programa deben programarse dentro de esos 3 días.";
      notificacionService.enviarATodos("Cambio de fechas del congreso", truncar(cuerpo), null);
    }

    if (cambioInsc) {
      String cuerpo =
          "Se modificó el período de inscripción: "
              + rangoTexto(despues.inscripcionesDesde(), despues.inscripcionesHasta())
              + ". Motivo: "
              + motivo;
      notificacionService.enviarATodos("Cambio en el período de inscripción", truncar(cuerpo), null);
    }

    if (cambioEnvio) {
      String cuerpo =
          describirCambioPlazo(
                  "envío de trabajos", antes.envioTrabajosHasta, despues.envioTrabajosHasta())
              + " Motivo: "
              + motivo;
      notificacionService.enviarPorRol(
          Rol.ASISTENTE, "Cambio en plazo de envío de trabajos", truncar(cuerpo), null);
      notificacionService.enviarPorRol(
          Rol.AUTOR, "Cambio en plazo de envío de trabajos", truncar(cuerpo), null);
    }

    if (cambioEval) {
      String cuerpo =
          describirCambioPlazo("evaluación", antes.evaluacionHasta, despues.evaluacionHasta())
              + " Motivo: "
              + motivo;
      notificacionService.enviarPorRol(
          Rol.EVALUADOR, "Cambio en plazo de evaluación", truncar(cuerpo), null);
    }
  }

  private static String describirCambioPlazo(String etiqueta, LocalDate antes, LocalDate despues) {
    if (antes == null && despues != null) {
      return "Se definió la fecha límite de " + etiqueta + ": " + fmt(despues) + ".";
    }
    if (antes != null && despues == null) {
      return "Se quitó la fecha límite de " + etiqueta + " (antes: " + fmt(antes) + ").";
    }
    if (antes != null && despues != null) {
      if (despues.isAfter(antes)) {
        return "Se extendió el plazo de "
            + etiqueta
            + " hasta el "
            + fmt(despues)
            + " (antes: "
            + fmt(antes)
            + ").";
      }
      if (despues.isBefore(antes)) {
        return "Se redujo el plazo de "
            + etiqueta
            + " al "
            + fmt(despues)
            + " (antes: "
            + fmt(antes)
            + ").";
      }
    }
    return "Se actualizó el plazo de " + etiqueta + ".";
  }

  private static String rangoTexto(LocalDate desde, LocalDate hasta) {
    if (desde == null && hasta == null) {
      return "sin fechas definidas";
    }
    if (desde != null && hasta != null) {
      return "del " + fmt(desde) + " al " + fmt(hasta);
    }
    if (desde != null) {
      return "desde el " + fmt(desde);
    }
    return "hasta el " + fmt(hasta);
  }

  private static String fmt(LocalDate d) {
    return d.format(FECHA_ES);
  }

  private static String truncar(String mensaje) {
    if (mensaje == null) {
      return "";
    }
    return mensaje.length() <= 1000 ? mensaje : mensaje.substring(0, 997) + "...";
  }

  private static void exigirMotivo(String motivo) {
    if (motivo == null || motivo.isBlank()) {
      throw new NegocioException(
          "Indicá el motivo del cambio de fechas (se notificará a los usuarios afectados).");
    }
  }

  private CongresoConfigDTO leerConfigDesdeEm(EntityManager em) {
    Congreso congreso = resolverCongresoPrincipal(em);
    return CongresoConfigDTO.from(congreso);
  }

  private Congreso resolverCongresoPrincipal(EntityManager em) {
    List<Congreso> list =
        em.createQuery("SELECT c FROM Congreso c ORDER BY c.id DESC", Congreso.class)
            .setMaxResults(1)
            .getResultList();
    if (!list.isEmpty()) {
      return list.getFirst();
    }
    Congreso congreso = new Congreso();
    congreso.setNombre("Congreso Argentino de Agroecología");
    congreso.setEdicion("V");
    em.persist(congreso);
    em.flush();
    return congreso;
  }

  /** Valida coherencia de rangos. Null = sin límite (no valida). Congreso = exactamente 3 días. */
  static void validarVentanas(Congreso c) {
    exigirDesdeHasta(c.getCongresoDesde(), c.getCongresoHasta(), "del congreso");
    exigirDesdeHasta(c.getInscripcionesDesde(), c.getInscripcionesHasta(), "de inscripción");
    exigirTresDiasCongreso(c.getCongresoDesde(), c.getCongresoHasta());

    LocalDate finCongreso = c.getCongresoHasta();
    if (finCongreso != null) {
      exigirNoPosterior(c.getEnvioTrabajosHasta(), finCongreso, "envío de trabajos");
      exigirNoPosterior(c.getEvaluacionHasta(), finCongreso, "evaluación");
      exigirNoPosterior(c.getInscripcionesHasta(), finCongreso, "inscripción");
    }
  }

  private static void exigirTresDiasCongreso(LocalDate desde, LocalDate hasta) {
    if (desde == null && hasta == null) {
      return;
    }
    if (desde == null || hasta == null) {
      throw new NegocioException(
          "Debés indicar inicio y fin del congreso (dura exactamente " + DIAS_CONGRESO + " días).");
    }
    long diasInclusive = ChronoUnit.DAYS.between(desde, hasta) + 1;
    if (diasInclusive != DIAS_CONGRESO) {
      throw new NegocioException(
          "El congreso dura exactamente "
              + DIAS_CONGRESO
              + " días. Si el inicio es "
              + desde
              + ", el fin debe ser "
              + desde.plusDays(DIAS_CONGRESO - 1L)
              + ".");
    }
  }

  private static void exigirDesdeHasta(LocalDate desde, LocalDate hasta, String etiqueta) {
    if (desde != null && hasta != null && desde.isAfter(hasta)) {
      throw new NegocioException(
          "La fecha de inicio " + etiqueta + " no puede ser posterior a la de fin.");
    }
  }

  private static void exigirNoPosterior(LocalDate fecha, LocalDate limite, String etiqueta) {
    if (fecha != null && fecha.isAfter(limite)) {
      throw new NegocioException(
          "La fecha límite de " + etiqueta + " no puede ser posterior al fin del congreso.");
    }
  }

  private static LocalDate parseFechaOpcional(String raw) {
    if (raw == null) {
      return null;
    }
    String trimmed = raw.trim();
    if (trimmed.isEmpty()) {
      return null;
    }
    try {
      return LocalDate.parse(trimmed);
    } catch (DateTimeParseException e) {
      throw new NegocioException("Fecha inválida (use AAAA-MM-DD): " + raw);
    }
  }

  private static final class SnapshotAntes {
    LocalDate congresoDesde;
    LocalDate congresoHasta;
    LocalDate inscripcionesDesde;
    LocalDate inscripcionesHasta;
    LocalDate envioTrabajosHasta;
    LocalDate evaluacionHasta;

    void capturar(Congreso c) {
      congresoDesde = c.getCongresoDesde();
      congresoHasta = c.getCongresoHasta();
      inscripcionesDesde = c.getInscripcionesDesde();
      inscripcionesHasta = c.getInscripcionesHasta();
      envioTrabajosHasta = c.getEnvioTrabajosHasta();
      evaluacionHasta = c.getEvaluacionHasta();
    }
  }
}
