package ar.edu.unlp.jyaa.grupo1.dao;

import ar.edu.unlp.jyaa.grupo1.modelo.Certificado;
import java.util.Optional;

public interface CertificadoDAO extends GenericDAO<Certificado> {

  Optional<Certificado> buscarPorUsuarioId(Long usuarioId);

  boolean existePorUsuarioId(Long usuarioId);
}
