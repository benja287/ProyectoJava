package ar.edu.unlp.jyaa.grupo1.modelo;

import jakarta.persistence.*;
import java.io.Serializable;

/** Precio de inscripción por categoría (configurable por admin). */
@Entity
@Table(
    name = "aranceles_categoria",
    uniqueConstraints = @UniqueConstraint(name = "uk_arancel_cat", columnNames = "categoria"))
public class ArancelCategoria implements Serializable {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, length = 40)
  private String categoria;

  @Column(nullable = false)
  private double monto;

  @Column(nullable = false, length = 8)
  private String moneda = "ARS";

  public ArancelCategoria() {}

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public String getCategoria() {
    return categoria;
  }

  public void setCategoria(String categoria) {
    this.categoria = categoria;
  }

  public double getMonto() {
    return monto;
  }

  public void setMonto(double monto) {
    this.monto = monto;
  }

  public String getMoneda() {
    return moneda;
  }

  public void setMoneda(String moneda) {
    this.moneda = moneda;
  }
}
