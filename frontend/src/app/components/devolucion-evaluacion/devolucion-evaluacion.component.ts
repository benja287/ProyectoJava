import { Component, Input, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ArchivoLinkComponent } from '../archivo-link/archivo-link.component';
import {
  etiquetaDecisionEvaluacion,
  RubricaEvaluacion,
} from '../../models/evaluacion.model';
import { DevolucionEvaluacionAutor } from '../../models/trabajo.model';
import { TrabajoService } from '../../servicios/trabajo.service';
import { mensajeErrorApi } from '../../utils/api-error.util';

@Component({
  selector: 'app-devolucion-evaluacion',
  standalone: true,
  imports: [CommonModule, ArchivoLinkComponent],
  template: `
    @if (visible) {
      <section class="devolucion-box">
        <h4>Devolución de evaluación</h4>
        <p class="muted small">
          Comentarios y archivo del/los evaluador/es (identidad oculta — doble ciego). Usalo para
          corregir y reenviar.
        </p>
        @if (cargando) {
          <p class="muted">Cargando devoluciones...</p>
        } @else if (error) {
          <p class="error">{{ error }}</p>
        } @else if (items.length === 0) {
          <p class="muted">
            No hay detalle de correcciones guardado para esta ronda. Corregí según la notificación y
            reenviá el trabajo.
          </p>
        } @else {
          @for (d of items; track d.evaluacionId; let i = $index) {
            <article class="devolucion-item">
              <p>
                <strong>Dictamen {{ items.length > 1 ? i + 1 : '' }}:</strong>
                {{ etiquetaDecision(d.recomendacion) }}
                @if (d.fecha) {
                  <span class="muted"> · {{ d.fecha }}</span>
                }
              </p>
              @if (d.comentario) {
                <p class="devolucion-comentario">{{ d.comentario }}</p>
              } @else {
                <p class="muted">Sin comentario textual del evaluador.</p>
              }
              @if (d.archivoCorreccionUrl) {
                <p>
                  Archivo con correcciones:
                  <app-archivo-link
                    [url]="d.archivoCorreccionUrl"
                    [label]="d.archivoCorreccionNombre || 'Descargar'"
                  />
                </p>
              }
              @if (resumenRubrica(d.rubricaJson); as rub) {
                <details>
                  <summary>Ver criterios de la rúbrica</summary>
                  <ul class="devolucion-rubrica">
                    <li>Pertinencia: {{ rub.general?.pertinencia || '—' }}</li>
                    <li>Eje temático correcto: {{ rub.general?.ejeCorrecto || '—' }}</li>
                    <li>Lenguaje: {{ rub.forma?.lenguaje?.valor || '—' }}</li>
                    <li>Título: {{ rub.forma?.titulo?.valor || '—' }}</li>
                    <li>Resumen: {{ rub.forma?.resumen?.valor || '—' }}</li>
                    <li>Palabras clave: {{ rub.forma?.palabrasClave?.valor || '—' }}</li>
                    <li>Bibliografía APA: {{ rub.bibliografia?.formatoApa?.valor || '—' }}</li>
                    <li>
                      Citas ↔ referencias: {{ rub.bibliografia?.coherenciaCitas?.valor || '—' }}
                    </li>
                    @if (rub.tipoSegunEvaluador === 'CIENTIFICO') {
                      <li>
                        Contenido — intro: {{ rub.contenidoCientifico?.introduccion?.valor || '—' }},
                        objetivos: {{ rub.contenidoCientifico?.objetivos?.valor || '—' }},
                        metodología: {{ rub.contenidoCientifico?.metodologia?.valor || '—' }},
                        resultados: {{ rub.contenidoCientifico?.resultadosDiscusion?.valor || '—' }},
                        conclusiones: {{ rub.contenidoCientifico?.conclusiones?.valor || '—' }}
                      </li>
                    }
                  </ul>
                </details>
              }
            </article>
          }
        }
      </section>
    }
  `,
  styles: [
    `
      .devolucion-box {
        margin-top: 0.75rem;
        padding: 0.75rem 1rem;
        border: 1px solid #e8d9a8;
        background: #fffbf0;
        border-radius: 8px;
      }
      .devolucion-box h4 {
        margin: 0 0 0.35rem;
        font-size: 1rem;
      }
      .devolucion-item + .devolucion-item {
        margin-top: 0.75rem;
        padding-top: 0.75rem;
        border-top: 1px dashed #e0d4b0;
      }
      .devolucion-comentario {
        white-space: pre-wrap;
        margin: 0.4rem 0;
      }
      .devolucion-rubrica {
        margin: 0.4rem 0 0;
        padding-left: 1.2rem;
        font-size: 0.9rem;
      }
      .small {
        font-size: 0.85rem;
      }
    `,
  ],
})
export class DevolucionEvaluacionComponent implements OnChanges {
  private readonly trabajoService = inject(TrabajoService);

  @Input({ required: true }) trabajoId!: number;
  @Input() estado?: string | null;

  visible = false;
  cargando = false;
  error = '';
  items: DevolucionEvaluacionAutor[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['trabajoId'] || changes['estado']) {
      this.recargar();
    }
  }

  etiquetaDecision(codigo?: string | null): string {
    return etiquetaDecisionEvaluacion(codigo);
  }

  resumenRubrica(json?: string | null): RubricaEvaluacion | null {
    if (!json?.trim()) {
      return null;
    }
    try {
      return JSON.parse(json) as RubricaEvaluacion;
    } catch {
      return null;
    }
  }

  private recargar(): void {
    this.visible = this.estado === 'OBSERVADO_EVALUACION' && !!this.trabajoId;
    this.error = '';
    this.items = [];
    if (!this.visible) {
      return;
    }
    this.cargando = true;
    this.trabajoService.listarDevolucionesEvaluacion(this.trabajoId).subscribe({
      next: (items) => {
        this.items = items;
        this.cargando = false;
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'No se pudieron cargar las devoluciones.');
        this.cargando = false;
      },
    });
  }
}
