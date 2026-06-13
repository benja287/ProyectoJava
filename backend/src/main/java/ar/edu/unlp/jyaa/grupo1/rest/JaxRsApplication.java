package ar.edu.unlp.jyaa.grupo1.rest;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.servers.Server;
import io.swagger.v3.jaxrs2.integration.resources.OpenApiResource;
import jakarta.ws.rs.ApplicationPath;
import jakarta.ws.rs.core.Application;
import java.util.Set;
import org.glassfish.jersey.media.multipart.MultiPartFeature;

@ApplicationPath("/api")
@OpenAPIDefinition(
    info = @Info(title = "Congreso Grupo 1 API", version = "1.0"),
    servers = @Server(url = "/"))
public class JaxRsApplication extends Application {

  @Override
  public Set<Class<?>> getClasses() {
    return Set.of(
        OpenApiResource.class,
        MultiPartFeature.class,
        NegocioExceptionMapper.class,
        NotFoundExceptionMapper.class,
        HealthResource.class,
        UsuarioResource.class,
        RegistroResource.class,
        PagoResource.class,
        ActividadResource.class,
        TrabajoResource.class,
        AsignacionEvaluacionResource.class,
        CronogramaResource.class,
        ArchivoResource.class,
        LoginResource.class,
        CircularesResource.class);
  }
}
