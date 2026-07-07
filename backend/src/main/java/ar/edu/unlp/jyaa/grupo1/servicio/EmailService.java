package ar.edu.unlp.jyaa.grupo1.servicio;

import ar.edu.unlp.jyaa.grupo1.dao.EnvioEmailDAO;
import ar.edu.unlp.jyaa.grupo1.dao.PlantillaEmailDAO;
import ar.edu.unlp.jyaa.grupo1.modelo.EnvioEmail;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

@RequestScoped
public class EmailService {

  @Inject private EmailDelivery emailDelivery;
  @Inject private EnvioEmailDAO envioEmailDAO;
  @Inject private PlantillaEmailDAO plantillaEmailDAO;

  public record ContenidoEmail(String asunto, String cuerpo) {}

  public boolean enviar(String destinatario, String asunto, String cuerpo) {
    return emailDelivery.entregar(destinatario, asunto, cuerpo);
  }

  public void enviarEnSegundoPlano(String destinatario, String asunto, String cuerpo) {
    emailDelivery.entregarEnSegundoPlano(destinatario, asunto, cuerpo);
  }

  public boolean enviarConPlantilla(
      String nombrePlantilla, String destinatario, Map<String, String> variables) {
    Optional<ContenidoEmail> contenido = renderizarPlantilla(nombrePlantilla, variables);
    if (contenido.isEmpty()) {
      registrarFallo(destinatario, nombrePlantilla, "Plantilla no encontrada: " + nombrePlantilla);
      return false;
    }
    return emailDelivery.entregar(destinatario, contenido.get().asunto(), contenido.get().cuerpo());
  }

  public void enviarConPlantillaEnSegundoPlano(
      String nombrePlantilla, String destinatario, Map<String, String> variables) {
    Optional<ContenidoEmail> contenido = renderizarPlantilla(nombrePlantilla, variables);
    if (contenido.isEmpty()) {
      registrarFallo(destinatario, nombrePlantilla, "Plantilla no encontrada: " + nombrePlantilla);
      return;
    }
    emailDelivery.entregarEnSegundoPlano(
        destinatario, contenido.get().asunto(), contenido.get().cuerpo());
  }

  public Optional<ContenidoEmail> renderizarPlantilla(
      String nombrePlantilla, Map<String, String> variables) {
    return plantillaEmailDAO
        .buscarPorNombre(nombrePlantilla)
        .map(
            plantilla ->
                new ContenidoEmail(
                    aplicarVariables(plantilla.getAsunto(), variables),
                    aplicarVariables(plantilla.getCuerpo(), variables)));
  }

  private void registrarFallo(String destinatario, String asunto, String error) {
    EnvioEmail registro = new EnvioEmail();
    registro.setDestinatario(destinatario != null ? destinatario : "");
    registro.setAsunto(asunto != null ? asunto : "");
    registro.setCuerpo("");
    registro.setFechaEnvio(LocalDateTime.now());
    registro.setEnviado(false);
    registro.setError(truncarError(error));
    envioEmailDAO.alta(registro);
  }

  static String aplicarVariables(String texto, Map<String, String> variables) {
    if (texto == null || variables == null || variables.isEmpty()) {
      return texto != null ? texto : "";
    }
    String resultado = texto;
    for (Map.Entry<String, String> entry : variables.entrySet()) {
      String valor = entry.getValue() != null ? entry.getValue() : "";
      resultado = resultado.replace("{{" + entry.getKey() + "}}", valor);
    }
    return resultado;
  }

  private static String truncarError(String error) {
    if (error == null) {
      return "error_desconocido";
    }
    return error.length() <= 500 ? error : error.substring(0, 500);
  }
}
