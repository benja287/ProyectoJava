package ar.edu.unlp.jyaa.grupo1.dao;

import ar.edu.unlp.jyaa.grupo1.modelo.FranjaHoraria;
import java.util.List;

public interface FranjaHorariaDAO extends GenericDAO<FranjaHoraria> {

  List<FranjaHoraria> listarTodas();

  List<FranjaHoraria> listarActivas();

  List<FranjaHoraria> listarActivasPorDia(int diaCongreso);
}
