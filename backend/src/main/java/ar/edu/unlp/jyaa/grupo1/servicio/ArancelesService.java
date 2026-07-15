package ar.edu.unlp.jyaa.grupo1.servicio;

import ar.edu.unlp.jyaa.grupo1.dao.ArancelCategoriaDAO;
import ar.edu.unlp.jyaa.grupo1.dao.CongresoDAO;
import ar.edu.unlp.jyaa.grupo1.modelo.ArancelCategoria;
import ar.edu.unlp.jyaa.grupo1.modelo.CategoriaInscripcion;
import ar.edu.unlp.jyaa.grupo1.modelo.Congreso;
import ar.edu.unlp.jyaa.grupo1.rest.dto.ArancelCategoriaRequest;
import ar.edu.unlp.jyaa.grupo1.rest.dto.ArancelesConfigUpdateRequest;
import ar.edu.unlp.jyaa.grupo1.web.dto.ArancelCategoriaDTO;
import ar.edu.unlp.jyaa.grupo1.web.dto.ArancelesConfigDTO;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

@RequestScoped
public class ArancelesService {

  @Inject private ArancelCategoriaDAO arancelDAO;
  @Inject private CongresoDAO congresoDAO;
  @Inject private DocumentStorageService documentStorageService;

  public ArancelesConfigDTO obtener(boolean vistaAdmin) {
    asegurarSemillaBasica();
    Congreso congreso = congresoDAO.obtenerPrincipal();
    List<ArancelCategoriaDTO> aranceles =
        arancelDAO.listarTodos().stream().map(ArancelCategoriaDTO::from).toList();

    boolean publicados = congreso.isArancelesPublicados();
    boolean ventana = ventanaInscripcionAbierta(congreso);
    String motivo = calcularMotivoBloqueo(publicados, ventana, congreso);

    if (!vistaAdmin && !publicados) {
      return new ArancelesConfigDTO(
          false, ventana, false, motivo, null, null, null, List.of());
    }

    boolean puede = publicados && ventana;
    return new ArancelesConfigDTO(
        publicados,
        ventana,
        puede,
        motivo,
        blankToNull(congreso.getAliasPago()),
        blankToNull(congreso.getQrPagoUrl()),
        blankToNull(congreso.getInstruccionesPago()),
        aranceles);
  }

  public ArancelesConfigDTO guardar(ArancelesConfigUpdateRequest request) {
    if (request == null) {
      throw new NegocioException("Debe enviar la configuración de aranceles");
    }
    asegurarSemillaBasica();
    Congreso congreso = congresoDAO.obtenerPrincipal();

    if (request.aliasPago() != null) {
      congreso.setAliasPago(blankToNull(request.aliasPago()));
    }
    if (request.instruccionesPago() != null) {
      congreso.setInstruccionesPago(blankToNull(request.instruccionesPago()));
    }

    if (request.aranceles() != null) {
      for (ArancelCategoriaRequest item : request.aranceles()) {
        upsertArancel(item);
      }
    }

    if (Boolean.TRUE.equals(request.publicar())) {
      validarListoParaPublicar(congreso);
      congreso.setArancelesPublicados(true);
    } else if (Boolean.FALSE.equals(request.publicar())) {
      congreso.setArancelesPublicados(false);
    }

    congresoDAO.modificar(congreso);
    return obtener(true);
  }

  public ArancelesConfigDTO subirQr(InputStream contenido, String filename) {
    if (contenido == null) {
      throw new NegocioException("Debe adjuntar una imagen de QR");
    }
    Congreso congreso = congresoDAO.obtenerPrincipal();
    try {
      if (congreso.getQrPagoUrl() != null) {
        documentStorageService.eliminarPorUrl(congreso.getQrPagoUrl());
      }
      String url =
          documentStorageService.guardar(
              DocumentStorageService.TipoArchivo.QR_PAGO, filename, contenido);
      congreso.setQrPagoUrl(url);
      congresoDAO.modificar(congreso);
    } catch (IOException e) {
      throw new NegocioException("No se pudo guardar el QR de pago");
    }
    return obtener(true);
  }

  public ArancelesConfigDTO quitarQr() {
    Congreso congreso = congresoDAO.obtenerPrincipal();
    if (congreso.getQrPagoUrl() != null) {
      documentStorageService.eliminarPorUrl(congreso.getQrPagoUrl());
      congreso.setQrPagoUrl(null);
      if (congreso.isArancelesPublicados()) {
        String alias = congreso.getAliasPago();
        if (alias == null || alias.isBlank()) {
          congreso.setArancelesPublicados(false);
        }
      }
      congresoDAO.modificar(congreso);
    }
    return obtener(true);
  }

  public double montoOficial(CategoriaInscripcion categoria) {
    asegurarSemillaBasica();
    ArancelCategoria arancel =
        arancelDAO
            .buscarPorCategoria(categoria.name())
            .orElseThrow(
                () ->
                    new NegocioException(
                        "No hay arancel configurado para la categoría " + categoria.name()));
    if (arancel.getMonto() <= 0) {
      throw new NegocioException("El arancel de " + categoria.name() + " no es válido");
    }
    return arancel.getMonto();
  }

  public void assertArancelesPublicadosYVentana() {
    Congreso congreso = congresoDAO.obtenerPrincipal();
    boolean publicados = congreso.isArancelesPublicados();
    boolean ventana = ventanaInscripcionAbierta(congreso);
    String motivo = calcularMotivoBloqueo(publicados, ventana, congreso);
    if (motivo != null) {
      throw new NegocioException(motivo);
    }
  }

  private void upsertArancel(ArancelCategoriaRequest item) {
    if (item == null || item.categoria() == null || item.categoria().isBlank()) {
      throw new NegocioException("Cada arancel debe indicar categoría");
    }
    CategoriaInscripcion categoria;
    try {
      categoria = CategoriaInscripcion.parse(item.categoria());
    } catch (IllegalArgumentException e) {
      throw new NegocioException("Categoría inválida: " + item.categoria());
    }
    if (item.monto() == null || item.monto() <= 0) {
      throw new NegocioException("El monto de " + categoria.name() + " debe ser mayor a 0");
    }
    String moneda =
        item.moneda() != null && !item.moneda().isBlank()
            ? item.moneda().trim().toUpperCase()
            : (categoria == CategoriaInscripcion.EXTRANJERO ? "USD" : "ARS");
    if (!moneda.equals("ARS") && !moneda.equals("USD")) {
      throw new NegocioException("Moneda inválida (use ARS o USD)");
    }

    ArancelCategoria existente =
        arancelDAO.buscarPorCategoria(categoria.name()).orElse(null);
    if (existente == null) {
      ArancelCategoria nuevo = new ArancelCategoria();
      nuevo.setCategoria(categoria.name());
      nuevo.setMonto(item.monto());
      nuevo.setMoneda(moneda);
      arancelDAO.alta(nuevo);
    } else {
      existente.setMonto(item.monto());
      existente.setMoneda(moneda);
      arancelDAO.modificar(existente);
    }
  }

  private void validarListoParaPublicar(Congreso congreso) {
    Map<CategoriaInscripcion, ArancelCategoria> porCat = new EnumMap<>(CategoriaInscripcion.class);
    for (ArancelCategoria a : arancelDAO.listarTodos()) {
      try {
        porCat.put(CategoriaInscripcion.parse(a.getCategoria()), a);
      } catch (IllegalArgumentException ignored) {
        // skip unknown
      }
    }
    List<String> faltantes = new ArrayList<>();
    for (CategoriaInscripcion cat : CategoriaInscripcion.values()) {
      ArancelCategoria a = porCat.get(cat);
      if (a == null || a.getMonto() <= 0) {
        faltantes.add(cat.name());
      }
    }
    if (!faltantes.isEmpty()) {
      throw new NegocioException(
          "Para publicar debés cargar precio de todas las categorías. Faltan: "
              + String.join(", ", faltantes));
    }
    boolean tieneAlias =
        congreso.getAliasPago() != null && !congreso.getAliasPago().isBlank();
    boolean tieneQr = congreso.getQrPagoUrl() != null && !congreso.getQrPagoUrl().isBlank();
    if (!tieneAlias && !tieneQr) {
      throw new NegocioException(
          "Para publicar debés indicar un alias de transferencia y/o subir un QR de pago");
    }
  }

  private void asegurarSemillaBasica() {
    if (!arancelDAO.listarTodos().isEmpty()) {
      return;
    }
    seedDefault(CategoriaInscripcion.SOCIO_SAAE, 75000, "ARS");
    seedDefault(CategoriaInscripcion.NO_SOCIO, 150000, "ARS");
    seedDefault(CategoriaInscripcion.ESTUDIANTE, 37000, "ARS");
    seedDefault(CategoriaInscripcion.PRODUCTOR, 50000, "ARS");
    seedDefault(CategoriaInscripcion.INVESTIGADOR, 150000, "ARS");
    seedDefault(CategoriaInscripcion.EXTENSIONISTA, 150000, "ARS");
    seedDefault(CategoriaInscripcion.DOCENTE, 150000, "ARS");
    seedDefault(CategoriaInscripcion.EXTRANJERO, 170, "USD");
  }

  private void seedDefault(CategoriaInscripcion cat, double monto, String moneda) {
    ArancelCategoria a = new ArancelCategoria();
    a.setCategoria(cat.name());
    a.setMonto(monto);
    a.setMoneda(moneda);
    arancelDAO.alta(a);
  }

  private static boolean ventanaInscripcionAbierta(Congreso congreso) {
    LocalDate hoy = LocalDate.now();
    LocalDate desde = congreso.getInscripcionesDesde();
    LocalDate hasta = congreso.getInscripcionesHasta();
    if (desde != null && hoy.isBefore(desde)) {
      return false;
    }
    if (hasta != null && hoy.isAfter(hasta)) {
      return false;
    }
    return true;
  }

  private static String calcularMotivoBloqueo(
      boolean publicados, boolean ventana, Congreso congreso) {
    if (!ventana) {
      LocalDate hoy = LocalDate.now();
      LocalDate desde = congreso.getInscripcionesDesde();
      LocalDate hasta = congreso.getInscripcionesHasta();
      if (desde != null && hoy.isBefore(desde)) {
        return "Las inscripciones abren el " + desde + ". Todavía no está habilitada la inscripción.";
      }
      if (hasta != null && hoy.isAfter(hasta)) {
        return "El período de inscripción cerró el "
            + hasta
            + ". Ya no se aceptan nuevas solicitudes.";
      }
      return "La ventana de inscripción no está abierta.";
    }
    if (!publicados) {
      return "Los aranceles y los datos de pago todavía no están disponibles. Cuando el admin los"
          + " publique vas a ver el precio de tu categoría y cómo transferir.";
    }
    return null;
  }

  private static String blankToNull(String value) {
    if (value == null || value.isBlank()) {
      return null;
    }
    return value.trim();
  }
}
