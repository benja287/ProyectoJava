package ar.edu.unlp.jyaa.grupo1.modelo;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import java.io.Serializable;
import java.util.Objects;

/** Ítem de catálogo editable del congreso (eje, modalidad o tipo de envío). */
@Embeddable
public class CatalogoItem implements Serializable {

  @Column(name = "codigo", nullable = false, length = 120)
  private String codigo;

  @Column(name = "etiqueta", nullable = false, length = 300)
  private String etiqueta;

  @Column(name = "activo", nullable = false)
  private boolean activo = true;

  @Column(name = "orden", nullable = false)
  private int orden;

  /**
   * Solo modalidades: {@code MESA}, {@code POSTER} o {@code NINGUNO}. Define a qué agenda
   * corresponde al programar.
   */
  @Column(name = "grupo_agenda", length = 20)
  private String grupoAgenda;

  /** Si es true no se puede borrar (códigos de sistema). */
  @Column(name = "sistema", nullable = false)
  private boolean sistema = false;

  public CatalogoItem() {}

  public CatalogoItem(String codigo, String etiqueta, int orden, boolean sistema) {
    this.codigo = codigo;
    this.etiqueta = etiqueta;
    this.orden = orden;
    this.sistema = sistema;
    this.activo = true;
  }

  public CatalogoItem(
      String codigo, String etiqueta, int orden, boolean sistema, String grupoAgenda) {
    this(codigo, etiqueta, orden, sistema);
    this.grupoAgenda = grupoAgenda;
  }

  public String getCodigo() {
    return codigo;
  }

  public void setCodigo(String codigo) {
    this.codigo = codigo;
  }

  public String getEtiqueta() {
    return etiqueta;
  }

  public void setEtiqueta(String etiqueta) {
    this.etiqueta = etiqueta;
  }

  public boolean isActivo() {
    return activo;
  }

  public void setActivo(boolean activo) {
    this.activo = activo;
  }

  public int getOrden() {
    return orden;
  }

  public void setOrden(int orden) {
    this.orden = orden;
  }

  public String getGrupoAgenda() {
    return grupoAgenda;
  }

  public void setGrupoAgenda(String grupoAgenda) {
    this.grupoAgenda = grupoAgenda;
  }

  public boolean isSistema() {
    return sistema;
  }

  public void setSistema(boolean sistema) {
    this.sistema = sistema;
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) {
      return true;
    }
    if (!(o instanceof CatalogoItem that)) {
      return false;
    }
    return Objects.equals(codigo, that.codigo);
  }

  @Override
  public int hashCode() {
    return Objects.hash(codigo);
  }
}
