package ar.edu.unlp.jyaa.grupo1.servicio;

import ar.edu.unlp.jyaa.grupo1.config.JpaUtil;
import ar.edu.unlp.jyaa.grupo1.modelo.CatalogoItem;
import ar.edu.unlp.jyaa.grupo1.modelo.CatalogosCongresoDefaults;
import ar.edu.unlp.jyaa.grupo1.modelo.Congreso;
import ar.edu.unlp.jyaa.grupo1.modelo.ModalidadPresentacion;
import ar.edu.unlp.jyaa.grupo1.modelo.TipoTrabajo;
import ar.edu.unlp.jyaa.grupo1.web.dto.CatalogoItemDTO;
import jakarta.enterprise.context.RequestScoped;
import jakarta.persistence.EntityManager;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;

@RequestScoped
public class CatalogoCongresoService {

  private static final Pattern CODIGO_OK = Pattern.compile("^[A-Za-z0-9_\\-]{2,80}$");
  private static final Set<String> GRUPOS_AGENDA = Set.of("MESA", "POSTER", "NINGUNO");

  public void asegurarCatalogos(Congreso congreso) {
    if (congreso.getEjesTematicos() == null || congreso.getEjesTematicos().isEmpty()) {
      congreso.setEjesTematicos(CatalogosCongresoDefaults.ejes());
    }
    if (congreso.getModalidadesPresentacion() == null
        || congreso.getModalidadesPresentacion().isEmpty()) {
      congreso.setModalidadesPresentacion(CatalogosCongresoDefaults.modalidades());
    }
    if (congreso.getTiposEnvio() == null || congreso.getTiposEnvio().isEmpty()) {
      congreso.setTiposEnvio(CatalogosCongresoDefaults.tiposEnvio());
    }
  }

  public void asegurarCatalogosEnBd() {
    JpaUtil.ejecutarEnTransaccion(
        em -> {
          Congreso c = resolverPrincipal(em);
          asegurarCatalogos(c);
          em.flush();
        });
  }

  public boolean esEjeActivo(String codigo) {
    return esActivo(listarEjes(), codigo, false);
  }

  public boolean esModalidadActiva(String codigo) {
    return esActivo(listarModalidades(), codigo, true);
  }

  public boolean esTipoEnvioActivo(String codigo) {
    return esActivo(listarTiposEnvio(), codigo, true);
  }

  /** Grupo de agenda ({@code MESA}, {@code POSTER} o {@code NINGUNO}) de una modalidad. */
  public String grupoAgendaDeModalidad(String codigo) {
    CatalogoItem item = buscarPorCodigo(listarModalidades(), codigo, true);
    return grupoAgendaDe(item, codigo);
  }

  /**
   * Códigos de modalidad que se programan en el grupo indicado. Incluye modalidades inactivas
   * porque los trabajos ya aprobados con esa modalidad igual deben poder programarse.
   */
  public Set<String> codigosModalidadPorGrupo(String grupoRaw) {
    String grupo = grupoRaw == null ? "" : grupoRaw.trim().toUpperCase(Locale.ROOT);
    Set<String> out = new LinkedHashSet<>();
    for (CatalogoItem m : listarModalidades()) {
      if (m.getCodigo() == null) {
        continue;
      }
      if (grupo.equals(grupoAgendaDe(m, m.getCodigo()))) {
        out.add(m.getCodigo().trim().toUpperCase(Locale.ROOT));
      }
    }
    if ("MESA".equals(grupo)) {
      out.add(ModalidadPresentacion.ORAL.name());
    } else if ("POSTER".equals(grupo)) {
      out.add(ModalidadPresentacion.POSTER.name());
    }
    return out;
  }

  private static String grupoAgendaDe(CatalogoItem item, String codigo) {
    String grupo = item != null ? item.getGrupoAgenda() : null;
    if (grupo != null && !grupo.isBlank()) {
      return grupo.trim().toUpperCase(Locale.ROOT);
    }
    if (ModalidadPresentacion.esOral(codigo)) {
      return "MESA";
    }
    if (ModalidadPresentacion.esPoster(codigo)) {
      return "POSTER";
    }
    return "NINGUNO";
  }

  /** Acepta activo o (inactivo pero ya usado) si allowInactiveLegacy. */
  public void exigirEjeValido(String eje) {
    if (eje == null || eje.isBlank()) {
      throw new NegocioException("Debe indicar el eje temático");
    }
    String c = eje.trim();
    CatalogoItem item = buscarPorCodigo(listarEjes(), c, false);
    if (item == null || !item.isActivo()) {
      throw new NegocioException("Eje temático inválido: " + c);
    }
  }

  public void exigirModalidadValida(String modalidad) {
    if (modalidad == null || modalidad.isBlank()) {
      throw new NegocioException("Debe indicar la modalidad de presentación");
    }
    String c = modalidad.trim().toUpperCase(Locale.ROOT);
    CatalogoItem item = buscarPorCodigo(listarModalidades(), c, true);
    if (item == null || !item.isActivo()) {
      throw new NegocioException("Modalidad inválida: " + modalidad);
    }
  }

  public void exigirTipoEnvioValido(String tipo) {
    if (tipo == null || tipo.isBlank()) {
      throw new NegocioException("Debe indicar el tipo de trabajo");
    }
    String c = tipo.trim().toUpperCase(Locale.ROOT);
    CatalogoItem item = buscarPorCodigo(listarTiposEnvio(), c, true);
    if (item == null || !item.isActivo()) {
      throw new NegocioException("Tipo de trabajo inválido: " + tipo);
    }
  }

  public List<CatalogoItem> listarEjes() {
    return JpaUtil.ejecutarEnTransaccionReturning(
        em -> {
          Congreso c = resolverPrincipal(em);
          asegurarCatalogos(c);
          return new ArrayList<>(c.getEjesTematicos());
        });
  }

  public List<CatalogoItem> listarModalidades() {
    return JpaUtil.ejecutarEnTransaccionReturning(
        em -> {
          Congreso c = resolverPrincipal(em);
          asegurarCatalogos(c);
          return new ArrayList<>(c.getModalidadesPresentacion());
        });
  }

  public List<CatalogoItem> listarTiposEnvio() {
    return JpaUtil.ejecutarEnTransaccionReturning(
        em -> {
          Congreso c = resolverPrincipal(em);
          asegurarCatalogos(c);
          return new ArrayList<>(c.getTiposEnvio());
        });
  }

  public void aplicarCatalogos(
      Congreso congreso,
      List<CatalogoItemDTO> ejes,
      List<CatalogoItemDTO> modalidades,
      List<CatalogoItemDTO> tipos) {
    if (ejes != null) {
      congreso.setEjesTematicos(normalizarLista(ejes, false, true));
    }
    if (modalidades != null) {
      List<CatalogoItem> mods = normalizarLista(modalidades, true, false);
      for (CatalogoItem m : mods) {
        if (m.getGrupoAgenda() == null || m.getGrupoAgenda().isBlank()) {
          m.setGrupoAgenda("NINGUNO");
        }
        String g = m.getGrupoAgenda().trim().toUpperCase(Locale.ROOT);
        if (!GRUPOS_AGENDA.contains(g)) {
          throw new NegocioException("grupoAgenda inválido (use MESA, POSTER o NINGUNO)");
        }
        m.setGrupoAgenda(g);
      }
      long activos = mods.stream().filter(CatalogoItem::isActivo).count();
      if (activos < 1) {
        throw new NegocioException("Debe quedar al menos una modalidad activa");
      }
      congreso.setModalidadesPresentacion(mods);
    }
    if (tipos != null) {
      List<CatalogoItem> ts = normalizarLista(tipos, true, false);
      boolean tieneTaller =
          ts.stream().anyMatch(t -> TipoTrabajo.esPropuestaTaller(t.getCodigo()));
      if (!tieneTaller) {
        ts.add(
            new CatalogoItem(
                TipoTrabajo.PROPUESTA_TALLER.name(), "Propuesta de taller", ts.size() + 1, true));
      }
      long paperActivos =
          ts.stream()
              .filter(CatalogoItem::isActivo)
              .filter(t -> !TipoTrabajo.esPropuestaTaller(t.getCodigo()))
              .count();
      if (paperActivos < 1) {
        throw new NegocioException("Debe quedar al menos un tipo de envío de trabajo activo");
      }
      congreso.setTiposEnvio(ts);
    }
    if (congreso.getEjesTematicos().stream().noneMatch(CatalogoItem::isActivo)) {
      throw new NegocioException("Debe quedar al menos un eje temático activo");
    }
  }

  private List<CatalogoItem> normalizarLista(
      List<CatalogoItemDTO> dtos, boolean codigoUpper, boolean codigoLibre) {
    if (dtos.isEmpty()) {
      throw new NegocioException("El catálogo no puede quedar vacío");
    }
    List<CatalogoItem> out = new ArrayList<>();
    Set<String> vistos = new HashSet<>();
    int i = 0;
    for (CatalogoItemDTO dto : dtos) {
      if (dto == null) {
        continue;
      }
      String etiqueta = dto.etiqueta() != null ? dto.etiqueta().trim() : "";
      if (etiqueta.isEmpty()) {
        throw new NegocioException("La etiqueta del catálogo no puede quedar vacía");
      }
      String codigo =
          dto.codigo() != null && !dto.codigo().isBlank()
              ? dto.codigo().trim()
              : etiqueta;
      if (codigoUpper) {
        codigo = codigo.toUpperCase(Locale.ROOT).replace(' ', '_');
      }
      if (!codigoLibre && !CODIGO_OK.matcher(codigo).matches()) {
        throw new NegocioException(
            "Código inválido \""
                + codigo
                + "\": usá letras, números, guiones o guión bajo (2-80)");
      }
      if (codigoLibre && codigo.length() > 300) {
        throw new NegocioException("El eje temático es demasiado largo");
      }
      String key = codigoUpper ? codigo.toUpperCase(Locale.ROOT) : codigo;
      if (!vistos.add(key)) {
        throw new NegocioException("Código duplicado en el catálogo: " + codigo);
      }
      CatalogoItem item = dto.toEntity();
      item.setCodigo(codigo);
      item.setEtiqueta(etiqueta);
      item.setOrden(dto.orden() > 0 ? dto.orden() : ++i);
      item.setActivo(dto.activo());
      item.setSistema(dto.sistema() || esCodigoSistema(codigo));
      out.add(item);
    }
    if (out.isEmpty()) {
      throw new NegocioException("El catálogo no puede quedar vacío");
    }
    return out;
  }

  private static boolean esCodigoSistema(String codigo) {
    if (codigo == null) {
      return false;
    }
    if (CatalogosCongresoDefaults.ejes().stream()
        .anyMatch(d -> d.getCodigo().equals(codigo))) {
      return true;
    }
    return "ORAL".equalsIgnoreCase(codigo)
        || "POSTER".equalsIgnoreCase(codigo)
        || TipoTrabajo.esPropuestaTaller(codigo)
        || "TRABAJO_CIENTIFICO".equalsIgnoreCase(codigo)
        || "RELATO_DE_EXPERIENCIA".equalsIgnoreCase(codigo);
  }

  private boolean esActivo(List<CatalogoItem> items, String codigo, boolean upper) {
    CatalogoItem item = buscarPorCodigo(items, codigo, upper);
    return item != null && item.isActivo();
  }

  private CatalogoItem buscarPorCodigo(List<CatalogoItem> items, String codigo, boolean upper) {
    if (codigo == null || codigo.isBlank()) {
      return null;
    }
    String needle = upper ? codigo.trim().toUpperCase(Locale.ROOT) : codigo.trim();
    for (CatalogoItem item : items) {
      if (item.getCodigo() == null) {
        continue;
      }
      String c = upper ? item.getCodigo().toUpperCase(Locale.ROOT) : item.getCodigo();
      if (needle.equals(c)) {
        return item;
      }
    }
    return null;
  }

  private Congreso resolverPrincipal(EntityManager em) {
    List<Congreso> lista =
        em.createQuery("SELECT c FROM Congreso c ORDER BY c.id", Congreso.class)
            .setMaxResults(1)
            .getResultList();
    if (lista.isEmpty()) {
      throw new NegocioException("No hay congreso configurado");
    }
    return lista.get(0);
  }
}
