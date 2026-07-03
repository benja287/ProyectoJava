import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ArchivoLinkComponent } from '../../../components/archivo-link/archivo-link.component';
import { Trabajo } from '../../../models/trabajo.model';
import { AsignacionEvaluacion } from '../../../models/asignacion.model';
import { AsignacionService } from '../../../servicios/asignacion.service';
import { TrabajoService } from '../../../servicios/trabajo.service';
import { mensajeErrorApi } from '../../../utils/api-error.util';

@Component({
  selector: 'app-comite-oc',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, ArchivoLinkComponent],
  template: `
    <section class="card">
      <h1>Comité académico — precheck y confirmación</h1>
      <p>
        1) Seleccioná un trabajo enviado → 2) marcá precheck apto u observado → 3) asigná evaluadores
        desde el menú de asignaciones → 4) confirmá la aprobación final cuando haya 2 evaluaciones favorables.
      </p>

      @if (error) {
        <p class="error">{{ error }}</p>
      }
      @if (mensaje) {
        <p class="ok">{{ mensaje }}</p>
      }

      <label>
        Trabajo
        <select [formControl]="trabajoCtrl">
          <option value="">Seleccionar...</option>
          @for (t of trabajos; track t.id) {
            <option [value]="t.id">
              #{{ t.id }} — {{ t.titulo }} ({{ t.estado }})
            </option>
          }
        </select>
      </label>

      @if (seleccionado) {
        <div class="detalle-trabajo box-muted">
          <p><strong>Título:</strong> {{ seleccionado.titulo }}</p>
          <p><strong>Estado:</strong> {{ seleccionado.estado }}</p>
          <p><strong>Eje:</strong> {{ seleccionado.ejeTematico || '—' }}</p>
          <p><strong>Modalidad:</strong> {{ seleccionado.modalidad || '—' }}</p>
          <p><strong>Precheck intentos:</strong> {{ seleccionado.precheckIntentos ?? 0 }}</p>
          @if (seleccionado.documentoUrl) {
            <p>
              <strong>PDF:</strong>
              <app-archivo-link [url]="seleccionado.documentoUrl" label="Ver documento" />
            </p>
          }
        </div>

        @if (seleccionado.estado === 'ENVIADO') {
          <div class="actions">
            <button type="button" class="btn-ok" (click)="precheck(true)" [disabled]="procesando">
              Marcar apto (precheck OK)
            </button>
            <button type="button" class="btn-warn" (click)="precheck(false)" [disabled]="procesando">
              Observar (precheck NO)
            </button>
          </div>
        }

        @if (seleccionado.estado === 'PENDIENTE_APROBACION_COMITE') {
          <h2>Confirmación final del comité</h2>
          <label>
            Observaciones (obligatorias si rechazás)
            <textarea [formControl]="observacionesCtrl" rows="3"></textarea>
          </label>
          <div class="actions">
            <button type="button" class="btn-ok" (click)="confirmar(true)" [disabled]="procesando">
              Confirmar aprobación
            </button>
            <button type="button" class="btn-warn" (click)="confirmar(false)" [disabled]="procesando">
              Rechazo definitivo
            </button>
          </div>
        }

        @if (asignaciones.length > 0) {
          <h2>Evaluaciones registradas</h2>
          <table>
            <thead>
              <tr>
                <th>Evaluador</th>
                <th>Aceptó</th>
                <th>Recomendación</th>
                <th>Comentario</th>
              </tr>
            </thead>
            <tbody>
              @for (a of asignaciones; track a.id) {
                <tr>
                  <td>{{ a.evaluadorApellido }}, {{ a.evaluadorNombre }}</td>
                  <td>{{ a.aceptada ? 'Sí' : 'No' }}</td>
                  <td>{{ a.evaluacionRecomendacion || '—' }}</td>
                  <td>{{ a.evaluacionComentario || '—' }}</td>
                </tr>
              }
            </tbody>
          </table>
        }
      }

      <p><a routerLink="/organizador">← Menú organizador</a></p>
    </section>
  `,
})
export class ComiteOcComponent implements OnInit {
  private fb = inject(FormBuilder);

  trabajos: Trabajo[] = [];
  seleccionado?: Trabajo;
  asignaciones: AsignacionEvaluacion[] = [];
  procesando = false;
  error = '';
  mensaje = '';

  trabajoCtrl = this.fb.control('');
  observacionesCtrl = this.fb.control('');

  constructor(
    private trabajoService: TrabajoService,
    private asignacionService: AsignacionService
  ) {}

  ngOnInit(): void {
    this.cargarTrabajos();
    this.trabajoCtrl.valueChanges.subscribe((v) => {
      const id = Number(v);
      if (id) {
        this.seleccionado = this.trabajos.find((t) => t.id === id);
        this.cargarAsignaciones(id);
      } else {
        this.seleccionado = undefined;
        this.asignaciones = [];
      }
    });
  }

  precheck(apto: boolean): void {
    if (!this.seleccionado?.id) return;
    if (!confirm(apto ? '¿Marcar como APTO (precheck OK)?' : '¿Marcar como OBSERVADO?')) return;
    this.procesando = true;
    this.error = '';
    this.trabajoService.precheck(this.seleccionado.id, apto).subscribe({
      next: (t) => {
        this.mensaje = apto ? 'Precheck OK registrado.' : 'Observación registrada.';
        this.procesando = false;
        this.actualizarTrabajo(t);
        this.cargarTrabajos();
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'No se pudo registrar el precheck.');
        this.procesando = false;
      },
    });
  }

  confirmar(aprobar: boolean): void {
    if (!this.seleccionado?.id) return;
    const obs = this.observacionesCtrl.value?.trim() || '';
    if (!aprobar && !obs) {
      this.error = 'Indicá el motivo del rechazo definitivo.';
      return;
    }
    this.procesando = true;
    this.error = '';
    this.trabajoService.confirmarComite(this.seleccionado.id, aprobar, obs || undefined).subscribe({
      next: (t) => {
        this.mensaje = aprobar ? 'Trabajo aprobado por el comité.' : 'Rechazo definitivo registrado.';
        this.procesando = false;
        this.observacionesCtrl.reset('');
        this.actualizarTrabajo(t);
        this.cargarTrabajos();
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'No se pudo confirmar.');
        this.procesando = false;
      },
    });
  }

  private actualizarTrabajo(t: Trabajo): void {
    this.seleccionado = t;
    const idx = this.trabajos.findIndex((x) => x.id === t.id);
    if (idx >= 0) this.trabajos[idx] = t;
  }

  private cargarTrabajos(): void {
    this.trabajoService.listar(1, 200).subscribe({
      next: (items) => {
        this.trabajos = items.filter(
          (t) =>
            t.estado === 'ENVIADO' ||
            t.estado === 'PRECHECK_OK' ||
            t.estado === 'EN_EVALUACION' ||
            t.estado === 'PENDIENTE_APROBACION_COMITE'
        );
        if (this.seleccionado?.id) {
          this.seleccionado = this.trabajos.find((t) => t.id === this.seleccionado!.id) ?? this.seleccionado;
        }
      },
      error: (err) => (this.error = mensajeErrorApi(err, 'No se pudieron cargar trabajos.')),
    });
  }

  private cargarAsignaciones(trabajoId: number): void {
    this.asignacionService.listarPorTrabajo(trabajoId).subscribe({
      next: (items) => (this.asignaciones = items),
      error: () => (this.asignaciones = []),
    });
  }
}
