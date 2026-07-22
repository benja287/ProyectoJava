package ar.edu.unlp.jyaa.grupo1.web.dto;

import ar.edu.unlp.jyaa.grupo1.modelo.CatalogoItem;

public record CatalogoItemDTO(
    String codigo, String etiqueta, boolean activo, int orden, String grupoAgenda, boolean sistema) {

  public static CatalogoItemDTO from(CatalogoItem item) {
    return new CatalogoItemDTO(
        item.getCodigo(),
        item.getEtiqueta(),
        item.isActivo(),
        item.getOrden(),
        item.getGrupoAgenda(),
        item.isSistema());
  }

  public CatalogoItem toEntity() {
    CatalogoItem item = new CatalogoItem();
    item.setCodigo(codigo != null ? codigo.trim() : null);
    item.setEtiqueta(etiqueta != null ? etiqueta.trim() : null);
    item.setActivo(activo);
    item.setOrden(orden);
    item.setGrupoAgenda(grupoAgenda != null && !grupoAgenda.isBlank() ? grupoAgenda.trim() : null);
    item.setSistema(sistema);
    return item;
  }
}
