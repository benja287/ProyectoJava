package ar.edu.unlp.jyaa.grupo1.dao.filtro;

import java.util.Map;

public final class JpqlLikeFilters {

  private JpqlLikeFilters() {}

  public static void appendLike(
      StringBuilder jpql, Map<String, Object> params, String field, String param, String value) {
    if (value == null || value.isBlank()) {
      return;
    }
    jpql.append(" AND LOWER(").append(field).append(") LIKE :").append(param);
    params.put(param, "%" + value.trim().toLowerCase() + "%");
  }
}
