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
import java.util.Locale;
import java.util.Objects;

@RequestScoped
public class CongresoService {

  private static final DateTimeFormatter FECHA_ES = DateTimeFormatter.ofPattern("dd/MM/yyyy");
  /** Días corridos del evento (día 1 = inicio, día 3 = fin ⇒ fin = inicio + 2). */
  private static final int DIAS_CONGRESO = 3;

  public static final String GRUPO_CONGRESO = "CONGRESO";
  public static final String GRUPO_INSCRIPCIONES = "INSCRIPCIONES";
  public static final String GRUPO_ENVIO = "ENVIO";
  public static final String GRUPO_EVALUACION = "EVALUACION";

  @Inject private NotificacionService notificacionService;

  public CongresoConfigDTO obtenerConfig() {
    return JpaUtil.ejecutarEnTransaccionReturning(this::leerConfigDesdeEm);
  }

  public boolean isProgramaPublicado() {
    return obtenerConfig().programaPublicado();
  }

  public CongresoConfigDTO actualizarConfig(CongresoConfigUpdateRequest request) {
    String grupo = normalizarGrupo(request.grupo());
    SnapshotAntes antes = new SnapshotAntes();

    CongresoConfigDTO dto =
        JpaUtil.ejecutarEnTransaccionReturning(
            em -> {
              Congreso congreso = resolverCongresoPrincipal(em);
              antes.capturar(congreso);

              if (grupo == null) {
                aplicarUpdateLegacy(congreso, request);
              } else {
                exigirMotivo(request.motivo());
                switch (grupo) {
                  case GRUPO_CONGRESO -> aplicarCongreso(congreso, request);
                  case GRUPO_INSCRIPCIONES -> aplicarInscripciones(congreso, request);
                  case GRUPO_ENVIO -> aplicarEnvio(congreso, request);
                  case GRUPO_EVALUACION -> aplicarEvaluacion(congreso, request);
                  default -> throw new NegocioException(
                      "grupo inválido (use CONGRESO, INSCRIPCIONES, ENVIO o EVALUACION)");
                }
              }

              validarVentanas(congreso);
              em.flush();
              return CongresoConfigDTO.from(congreso);
            });

    if (grupo != null) {
      notificarSoloGrupo(grupo, antes, dto, request.motivo().trim());
    } else if (request.envioTrabajosHasta() != null
        && !Objects.equals(antes.envioTrabajosHasta, dto.envioTrabajosHasta())) {
      String motivo =
          request.motivo() != null && !request.motivo().isBlank()
              ? request.motivo().trim()
              : "Actualización de la fecha límite de envío de trabajos.";
      notificarSoloGrupo(GRUPO_ENVIO, antes, dto, motivo);
    }

    return dto;
  }

  private void aplicarUpdateLegacy(Congreso congreso, CongresoConfigUpdateRequest request) {
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
  }

  private void aplicarCongreso(Congreso congreso, CongresoConfigUpdateRequest request) {
    LocalDate desde = parseFechaOpcional(request.congresoDesde());
    if (desde == null) {
      throw new NegocioException("Indicá la fecha de inicio del congreso.");
    }
    // Siempre 3 días corridos: inicio, intermedio y fin.
    LocalDate hasta = desde.plusDays(DIAS_CONGRESO - 1L);
    congreso.setCongresoDesde(desde);
    congreso.setCongresoHasta(hasta);
  }

  private void aplicarInscripciones(Congreso congreso, CongresoConfigUpdateRequest request) {
    if (request.inscripcionesDesde() == null && request.inscripcionesHasta() == null) {
      throw new NegocioException("Indicá al menos una fecha del período de inscripción.");
    }
    if (request.inscripcionesDesde() != null) {
      congreso.setInscripcionesDesde(parseFechaOpcional(request.inscripcionesDesde()));
    }
    if (request.inscripcionesHasta() != null) {
      congreso.setInscripcionesHasta(parseFechaOpcional(request.inscripcionesHasta()));
    }
  }

  private void aplicarEnvio(Congreso congreso, CongresoConfigUpdateRequest request) {
    if (request.envioTrabajosHasta() == null) {
      throw new NegocioException("Indicá la fecha límite de envío de trabajos (o vacío para quitarla).");
    }
    congreso.setEnvioTrabajosHasta(parseFechaOpcional(request.envioTrabajosHasta()));
  }

  private void aplicarEvaluacion(Congreso congreso, CongresoConfigUpdateRequest request) {
    if (request.evaluacionHasta() == null) {
      throw new NegocioException("Indicá la fecha límite de evaluación (o vacío para quitarla).");
    }
    congreso.setEvaluacionHasta(parseFechaOpcional(request.evaluacionHasta()));
  }

  private void notificarSoloGrupo(
      String grupo, SnapshotAntes antes, CongresoConfigDTO despues, String motivo) {
    switch (grupo) {
      case GRUPO_CONGRESO -> {
        if (Objects.equals(antes.congresoDesde, despues.congresoDesde())
            && Objects.equals(antes.congresoHasta, despues.congresoHasta())) {
          return;
        }
        String cuerpo =
            "Se actualizaron las fechas del congreso: "
                + rangoTexto(despues.congresoDesde(), despues.congresoHasta())
                + " (3 días). Motivo: "
                + motivo
                + ". Las actividades del programa deben programarse dentro de esos días.";
        notificacionService.enviarATodos("Cambio de fechas del congreso", truncar(cuerpo), null);
      }
      case GRUPO_INSCRIPCIONES -> {
        if (Objects.equals(antes.inscripcionesDesde, despues.inscripcionesDesde())
            && Objects.equals(antes.inscripcionesHasta, despues.inscripcionesHasta())) {
          return;
        }
        String cuerpo =
            "Se modificó el período de inscripción: "
                + rangoTexto(despues.inscripcionesDesde(), despues.inscripcionesHasta())
                + ". Motivo: "
                + motivo;
        notificacionService.enviarATodos(
            "Cambio en el período de inscripción", truncar(cuerpo), null);
      }
      case GRUPO_ENVIO -> {
        if (Objects.equals(antes.envioTrabajosHasta, despues.envioTrabajosHasta())) {
          return;
        }
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
      case GRUPO_EVALUACION -> {
        if (Objects.equals(antes.evaluacionHasta, despues.evaluacionHasta())) {
          return;
        }
        String cuerpo =
            describirCambioPlazo("evaluación", antes.evaluacionHasta, despues.evaluacionHasta())
                + " Motivo: "
                + motivo;
        notificacionService.enviarPorRol(
            Rol.EVALUADOR, "Cambio en plazo de evaluación", truncar(cuerpo), null);
      }
      default -> {
        // no-op
      }
    }
  }

  private static String normalizarGrupo(String raw) {
    if (raw == null || raw.isBlank()) {
      return null;
    }
    return raw.trim().toUpperCase(Locale.ROOT);
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
    return CongresoConfigDTO.from(resolverCongresoPrincipal(em));
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
              + " días corridos (día 1, 2 y 3). Si el inicio es "
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
