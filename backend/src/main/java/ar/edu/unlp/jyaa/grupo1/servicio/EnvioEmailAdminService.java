package ar.edu.unlp.jyaa.grupo1.servicio;

import ar.edu.unlp.jyaa.grupo1.dao.EnvioEmailDAO;
import ar.edu.unlp.jyaa.grupo1.dao.filtro.EnvioEmailFiltro;
import ar.edu.unlp.jyaa.grupo1.modelo.EnvioEmail;
import ar.edu.unlp.jyaa.grupo1.web.dto.EnvioEmailDTO;
import ar.edu.unlp.jyaa.grupo1.web.dto.EnvioEmailResumenDTO;
import ar.edu.unlp.jyaa.grupo1.web.dto.LimpiezaEnvioEmailResultDTO;
import ar.edu.unlp.jyaa.grupo1.web.dto.PaginaEnviosEmailDTO;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import java.time.LocalDateTime;
import java.util.List;

@RequestScoped
public class EnvioEmailAdminService {

  private static final int SIZE_DEFAULT = 20;
  private static final int SIZE_MAX = 100;
  private static final int DIAS_ANTIGUOS_DEFAULT = 30;

  @Inject private EnvioEmailDAO envioEmailDAO;

  public PaginaEnviosEmailDTO listar(
      int page, int size, Boolean enviado, String destinatario) {
    int safePage = Math.max(1, page);
    int safeSize = Math.min(Math.max(1, size), SIZE_MAX);
    int offset = (safePage - 1) * safeSize;
    EnvioEmailFiltro filtro = new EnvioEmailFiltro(enviado, destinatario);
    long total = envioEmailDAO.contarFiltrado(filtro);
    List<EnvioEmailDTO> items =
        envioEmailDAO.listarFiltrado(filtro, offset, safeSize).stream()
            .map(EnvioEmailDTO::from)
            .toList();
    int totalPages = total == 0 ? 0 : (int) Math.ceil((double) total / safeSize);
    return new PaginaEnviosEmailDTO(items, safePage, safeSize, total, totalPages);
  }

  public EnvioEmailResumenDTO resumen() {
    long enviados = envioEmailDAO.contarEnviados();
    long fallidos = envioEmailDAO.contarFallidos();
    return new EnvioEmailResumenDTO(enviados + fallidos, enviados, fallidos);
  }

  public EnvioEmailDTO obtener(Long id) {
    EnvioEmail e = envioEmailDAO.recuperarPorId(id);
    if (e == null) {
      throw new NegocioException("Registro de email no encontrado: " + id);
    }
    return EnvioEmailDTO.from(e);
  }

  public void eliminar(Long id) {
    EnvioEmail e = envioEmailDAO.recuperarPorId(id);
    if (e == null) {
      throw new NegocioException("Registro de email no encontrado: " + id);
    }
    envioEmailDAO.baja(id);
  }

  public LimpiezaEnvioEmailResultDTO limpiar(String alcance, Integer dias) {
    if (alcance == null || alcance.isBlank()) {
      throw new NegocioException("Debe indicar el alcance: fallidos, antiguos o todos");
    }
    return switch (alcance.trim().toLowerCase()) {
      case "fallidos" -> {
        int n = envioEmailDAO.eliminarFallidos();
        yield new LimpiezaEnvioEmailResultDTO(n, "Se eliminaron " + n + " envíos fallidos.");
      }
      case "antiguos" -> {
        int diasEfectivos = dias != null && dias > 0 ? dias : DIAS_ANTIGUOS_DEFAULT;
        LocalDateTime corte = LocalDateTime.now().minusDays(diasEfectivos);
        int n = envioEmailDAO.eliminarAntesDe(corte);
        yield new LimpiezaEnvioEmailResultDTO(
            n, "Se eliminaron " + n + " envíos anteriores a " + diasEfectivos + " días.");
      }
      case "todos" -> {
        int n = envioEmailDAO.eliminarTodos();
        yield new LimpiezaEnvioEmailResultDTO(n, "Se eliminó todo el historial de emails (" + n + ").");
      }
      default ->
          throw new NegocioException(
              "Alcance inválido. Use: fallidos, antiguos o todos");
    };
  }
}
