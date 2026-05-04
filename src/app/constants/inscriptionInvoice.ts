import type { InscriptionCategory } from '../context/AuthContext';

export const CATEGORY_LABEL_ES: Record<InscriptionCategory, string> = {
  socio_saae: 'Socio/a SAAE',
  no_socio: 'No socio/a',
  estudiante: 'Estudiante de grado',
  productor: 'Productor/a de organización o comunidad',
  investigador: 'Investigador/a',
  extensionista: 'Extensionista',
  docente: 'Docente',
  extranjero: 'Extranjero/a',
};

/** Montos de referencia al aprobar inscripción (misma lógica que la pantalla de inscripción). */
export const CATEGORY_AMOUNT_LABEL: Record<InscriptionCategory, string> = {
  socio_saae: '$ 75.000 ARS',
  no_socio: '$ 150.000 ARS',
  estudiante: '$ 37.000 ARS',
  productor: '$ 50.000 ARS',
  investigador: '$ 150.000 ARS',
  extensionista: '$ 150.000 ARS',
  docente: '$ 150.000 ARS',
  extranjero: 'USD 170',
};

export function getInscriptionInvoiceLines(category?: InscriptionCategory | string) {
  const cat = category as InscriptionCategory | undefined;
  if (!cat || !(cat in CATEGORY_AMOUNT_LABEL)) {
    return {
      categoryLabel: 'Sin categoría / a confirmar',
      amountLabel: '—',
      taxNote: 'Monto según tarifario vigente del congreso.',
    };
  }
  return {
    categoryLabel: CATEGORY_LABEL_ES[cat],
    amountLabel: CATEGORY_AMOUNT_LABEL[cat],
    taxNote: 'Los importes pueden incluir IVA según normativa aplicable.',
  };
}
