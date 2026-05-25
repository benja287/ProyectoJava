package ar.edu.unlp.jyaa.grupo1.modelo;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import java.io.Serializable;
import java.time.LocalDate;

@Embeddable
public class RangoFechas implements Serializable {

  @Column(name = "desde")
  private LocalDate desde;

  @Column(name = "hasta")
  private LocalDate hasta;

  public RangoFechas() {}

  public RangoFechas(LocalDate desde, LocalDate hasta) {
    this.desde = desde;
    this.hasta = hasta;
  }

  public LocalDate getDesde() {
    return desde;
  }

  public void setDesde(LocalDate desde) {
    this.desde = desde;
  }

  public LocalDate getHasta() {
    return hasta;
  }

  public void setHasta(LocalDate hasta) {
    this.hasta = hasta;
  }
}
