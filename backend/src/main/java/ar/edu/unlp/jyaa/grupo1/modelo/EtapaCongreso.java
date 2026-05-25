package ar.edu.unlp.jyaa.grupo1.modelo;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.Embedded;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import java.io.Serializable;

@Embeddable
public class EtapaCongreso implements Serializable {

  @Enumerated(EnumType.STRING)
  @Column(name = "etapa", nullable = false)
  private EtapaProceso etapa;

  @Embedded private RangoFechas rango = new RangoFechas();

  public EtapaCongreso() {}

  public EtapaProceso getEtapa() {
    return etapa;
  }

  public void setEtapa(EtapaProceso etapa) {
    this.etapa = etapa;
  }

  public RangoFechas getRango() {
    return rango;
  }

  public void setRango(RangoFechas rango) {
    this.rango = rango;
  }
}
