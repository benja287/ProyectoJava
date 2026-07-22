/** Ejes temáticos oficiales del V CAAE UNLP 2027. */
export const EJES_TEMATICOS = [
  'Diseño y manejo de sistemas productivos agroecológicos',
  'Formación y construcción de saberes agroecológicos',
  'Metodologías de análisis y diagnóstico',
  'Semillas, agrobiodiversidad y servicios ecosistémicos',
  'Salud, nutrición y agroecología',
  'Economía, valor agregado y comercialización',
  'Planificación y desarrollo territorial',
  'Pueblos indígenas, géneros y juventudes',
  'Políticas públicas, movimientos sociales e institucionalidades',
] as const;

export const MODALIDADES_PRESENTACION = ['ORAL', 'POSTER'] as const;

export type ModalidadPresentacion = (typeof MODALIDADES_PRESENTACION)[number];

export const MODALIDAD_LABELS: Record<string, string> = {
  ORAL: 'Oral',
  POSTER: 'Póster',
};
