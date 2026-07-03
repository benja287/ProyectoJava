package ar.edu.unlp.jyaa.grupo1.servicio;

import ar.edu.unlp.jyaa.grupo1.dao.InscripcionCongresoDAO;
import ar.edu.unlp.jyaa.grupo1.dao.UsuarioDAO;
import ar.edu.unlp.jyaa.grupo1.dao.filtro.InscripcionFiltro;
import ar.edu.unlp.jyaa.grupo1.modelo.CategoriaInscripcion;
import ar.edu.unlp.jyaa.grupo1.modelo.EstadoInscripcion;
import ar.edu.unlp.jyaa.grupo1.modelo.EstadoPago;
import ar.edu.unlp.jyaa.grupo1.modelo.InscripcionCongreso;
import ar.edu.unlp.jyaa.grupo1.modelo.Usuario;
import ar.edu.unlp.jyaa.grupo1.security.AuthenticatedUser;
import ar.edu.unlp.jyaa.grupo1.web.dto.InscripcionCongresoDTO;
import ar.edu.unlp.jyaa.grupo1.web.dto.PaginaInscripcionesDTO;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDate;
import java.util.List;

@RequestScoped
public class InscripcionService {

  private static final int PAGE_DEFAULT = 1;
  private static final int SIZE_DEFAULT = 20;
  private static final int SIZE_MAX = 100;

  @Inject private InscripcionCongresoDAO inscripcionDAO;
  @Inject private UsuarioDAO usuarioDAO;
  @Inject private DocumentStorageService documentStorageService;

  public InscripcionCongresoDTO crear(
      AuthenticatedUser auth,
      String categoriaRaw,
      String institucion,
      String provincia,
      boolean requiereFactura,
      InputStream certificado,
      String certificadoNombre) {
    Usuario usuario = usuarioDAO.recuperarPorId(auth.userId());
    if (usuario == null) {
      throw new NegocioException("Usuario no encontrado");
    }

    CategoriaInscripcion categoria = parseCategoria(categoriaRaw);
    validarDatos(categoria, institucion, provincia, requiereFactura, certificado);

    inscripcionDAO
        .buscarUltimaPorUsuario(auth.userId())
        .ifPresent(
            existente -> {
              if (existente.getEstado() != EstadoInscripcion.RECHAZADA) {
                throw new NegocioException(
                    "Ya tiene una inscripción "
                        + existente.getEstado().name().toLowerCase()
                        + ". Solo puede crear una nueva si fue rechazada.");
              }
            });

    InscripcionCongreso inscripcion = new InscripcionCongreso();
    inscripcion.setUsuario(usuario);
    inscripcion.setCategoria(categoria.name());
    inscripcion.setInstitucion(institucion.trim());
    inscripcion.setProvincia(provincia.trim());
    inscripcion.setRequiereFactura(requiereFactura);
    inscripcion.setEstado(EstadoInscripcion.PENDIENTE);
    inscripcion.setFechaSolicitud(LocalDate.now());

    if (certificado != null) {
      try {
        String url =
            documentStorageService.guardar(
                DocumentStorageService.TipoArchivo.CERTIFICADO_INSCRIPCION,
                certificadoNombre,
                certificado);
        inscripcion.setCertificadoUrl(url);
      } catch (IOException e) {
        throw new NegocioException("No se pudo guardar el certificado: " + e.getMessage());
      }
    }

    InscripcionCongreso creada = inscripcionDAO.alta(inscripcion);
    return InscripcionCongresoDTO.from(recuperarConRelaciones(creada.getId()));
  }

  public InscripcionCongresoDTO misDatos(AuthenticatedUser auth) {
    return inscripcionDAO
        .buscarUltimaPorUsuario(auth.userId())
        .map(InscripcionCongresoDTO::from)
        .orElseThrow(() -> new NegocioException("No tiene inscripciones registradas"));
  }

  public PaginaInscripcionesDTO listar(
      int page, int size, InscripcionFiltro filtro, AuthenticatedUser auth) {
    if (!auth.canValidarInscripciones()) {
      throw new NegocioException("No tiene permiso para listar inscripciones");
    }
    return listarFiltrado(page, size, filtro != null ? filtro : new InscripcionFiltro(null, null, null));
  }

  public InscripcionCongresoDTO validar(
      Long id, boolean aprobar, String motivoRechazo, AuthenticatedUser auth) {
    if (!auth.canValidarInscripciones()) {
      throw new NegocioException("No tiene permiso para validar inscripciones");
    }
    InscripcionCongreso inscripcion = recuperarConRelaciones(id);
    if (inscripcion == null) {
      return null;
    }
    if (inscripcion.getEstado() != EstadoInscripcion.PENDIENTE) {
      throw new NegocioException("La inscripción ya fue procesada");
    }

    if (!aprobar) {
      if (motivoRechazo == null || motivoRechazo.isBlank()) {
        throw new NegocioException("Debe indicar el motivo de rechazo");
      }
      inscripcion.setEstado(EstadoInscripcion.RECHAZADA);
      inscripcion.setMotivoRechazo(motivoRechazo.trim());
    } else {
      inscripcion.setEstado(EstadoInscripcion.APROBADA);
      inscripcion.setMotivoRechazo(null);
    }

    inscripcionDAO.modificar(inscripcion);
    return InscripcionCongresoDTO.from(recuperarConRelaciones(id));
  }

  public static InscripcionFiltro parseFiltro(String estado, String categoria) {
    EstadoInscripcion estadoEnum = null;
    if (estado != null && !estado.isBlank()) {
      try {
        estadoEnum = EstadoInscripcion.valueOf(estado.trim().toUpperCase());
      } catch (IllegalArgumentException e) {
        throw new NegocioException("Estado de inscripción inválido: " + estado);
      }
    }
    String categoriaNormalizada = null;
    if (categoria != null && !categoria.isBlank()) {
      categoriaNormalizada = parseCategoria(categoria).name();
    }
    return new InscripcionFiltro(estadoEnum, categoriaNormalizada, null);
  }

  private PaginaInscripcionesDTO listarFiltrado(int page, int size, InscripcionFiltro filtro) {
    int safePage = Math.max(PAGE_DEFAULT, page);
    int safeSize = Math.min(Math.max(1, size), SIZE_MAX);
    int offset = (safePage - 1) * safeSize;

    long total = inscripcionDAO.contarFiltrado(filtro);
    List<InscripcionCongresoDTO> items =
        inscripcionDAO.listarFiltrado(filtro, offset, safeSize).stream()
            .map(InscripcionCongresoDTO::from)
            .toList();
    int totalPages = total == 0 ? 0 : (int) Math.ceil((double) total / safeSize);
    return new PaginaInscripcionesDTO(items, safePage, safeSize, total, totalPages);
  }

  private InscripcionCongreso recuperarConRelaciones(Long id) {
    InscripcionCongreso inscripcion = inscripcionDAO.recuperarPorId(id);
    if (inscripcion == null) {
      return null;
    }
    inscripcion.getUsuario().getNombre();
    if (inscripcion.getPago() != null) {
      inscripcion.getPago().getEstado();
    }
    return inscripcion;
  }

  private static CategoriaInscripcion parseCategoria(String value) {
    try {
      return CategoriaInscripcion.parse(value);
    } catch (IllegalArgumentException e) {
      throw new NegocioException("Categoría de inscripción inválida: " + value);
    }
  }

  private static void validarDatos(
      CategoriaInscripcion categoria,
      String institucion,
      String provincia,
      boolean requiereFactura,
      InputStream certificado) {
    if (institucion == null || institucion.isBlank()) {
      throw new NegocioException("Debe indicar la institución");
    }
    if (provincia == null || provincia.isBlank()) {
      throw new NegocioException("Debe indicar la provincia");
    }
    if (requiereFactura && (institucion.isBlank() || provincia.isBlank())) {
      throw new NegocioException("Para factura debe completar institución y provincia");
    }
    if (categoria.requiereCertificado() && certificado == null) {
      throw new NegocioException("La categoría " + categoria.name() + " requiere adjuntar certificado");
    }
  }

  /** Usado por PagoService para verificar inscripción previa. */
  public InscripcionCongreso buscarUltimaPorUsuario(Long usuarioId) {
    return inscripcionDAO.buscarUltimaPorUsuario(usuarioId).orElse(null);
  }

  public boolean puedeRegistrarPago(InscripcionCongreso inscripcion) {
    if (inscripcion == null) {
      return false;
    }
    if (inscripcion.getEstado() == EstadoInscripcion.RECHAZADA) {
      return false;
    }
    if (inscripcion.getPago() == null) {
      return true;
    }
    return inscripcion.getPago().getEstado() == EstadoPago.RECHAZADO;
  }
}
