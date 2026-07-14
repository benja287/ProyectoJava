import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  FranjaHoraria,
  etiquetaFranja,
} from '../../../models/franja-horaria.model';
import { FranjaHorariaService } from '../../../servicios/franja-horaria.service';
import { mensajeErrorApi } from '../../../utils/api-error.util';

@Component({
  selector: 'app-congreso-franjas-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="panel-page">
      <div class="panel-hero panel-hero--admin">
        <span class="panel-hero-icon" aria-hidden="true">⏱</span>
        <div>
          <h1>Franjas horarias</h1>
          <p>Bloques de horario por día lógico del congreso (1, 2 y 3)</p>
        </div>
      </div>

      <p class="panel-volver"><a routerLink="/admin/congreso">← Volver a Congreso</a></p>

      @if (feedback) {
        <p [class]="feedbackOk ? 'ok' : 'error'">{{ feedback }}</p>
      }

      <section class="panel-card">
        <h2>{{ editId ? 'Editar franja' : 'Nueva franja' }}</h2>
        <p class="muted">
          Las actividades del programa se crean eligiendo una de estas franjas. El día 1 coincide con
          el inicio del congreso configurado en Ventanas de tiempo.
        </p>
        <div class="form-grid form-grid-wide">
          <label>
            Día del congreso
            <select [(ngModel)]="form.diaCongreso" [ngModelOptions]="{ standalone: true }">
              <option [ngValue]="1">Día 1</option>
              <option [ngValue]="2">Día 2</option>
              <option [ngValue]="3">Día 3</option>
            </select>
          </label>
          <label>
            Etiqueta (opcional)
            <input
              type="text"
              [(ngModel)]="form.etiqueta"
              [ngModelOptions]="{ standalone: true }"
              placeholder="Mañana"
            />
          </label>
          <label>
            Hora inicio
            <input
              type="time"
              [(ngModel)]="form.horaInicio"
              [ngModelOptions]="{ standalone: true }"
            />
          </label>
          <label>
            Hora fin
            <input type="time" [(ngModel)]="form.horaFin" [ngModelOptions]="{ standalone: true }" />
          </label>
        </div>
        <div class="inline-form-row" style="margin-top: 0.75rem">
          <button type="button" class="btn-primary" [disabled]="guardando" (click)="guardar()">
            {{ guardando ? 'Guardando...' : editId ? 'Actualizar franja' : 'Crear franja' }}
          </button>
          @if (editId) {
            <button type="button" class="btn-link" [disabled]="guardando" (click)="cancelar()">
              Cancelar
            </button>
          }
        </div>
      </section>

      <section class="panel-card" style="margin-top: 1.25rem">
        <h2>Listado</h2>
        @if (cargando) {
          <p class="muted">Cargando...</p>
        } @else if (!franjas.length) {
          <p class="muted">No hay franjas cargadas.</p>
        } @else {
          <div class="aulas-tabla-wrap">
            <table class="tabla-simple aulas-tabla">
              <thead>
                <tr>
                  <th>Día</th>
                  <th>Franja</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (f of franjas; track f.id) {
                  <tr>
                    <td>Día {{ f.diaCongreso }}</td>
                    <td>{{ label(f) }}</td>
                    <td>{{ f.activa ? 'Activa' : 'Inactiva' }}</td>
                    <td>
                      <div class="aulas-acciones">
                        <button type="button" class="btn-link" (click)="editar(f)">Editar</button>
                        @if (f.activa) {
                          <button type="button" class="btn-link" (click)="desactivar(f)">
                            Desactivar
                          </button>
                        }
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </section>
    </div>
  `,
  styles: [
    `
      .aulas-tabla-wrap {
        margin-top: 1rem;
        overflow-x: auto;
      }
      .aulas-tabla {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
      }
      .aulas-tabla th,
      .aulas-tabla td {
        padding: 0.85rem 1rem;
        vertical-align: top;
        border-bottom: 1px solid rgba(15, 23, 42, 0.08);
      }
      .aulas-tabla th {
        text-align: left;
        font-size: 0.8rem;
        text-transform: uppercase;
        letter-spacing: 0.03em;
        color: #64748b;
      }
      .aulas-acciones {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 0.45rem;
      }
    `,
  ],
})
export class CongresoFranjasAdminComponent implements OnInit {
  private franjaService = inject(FranjaHorariaService);

  franjas: FranjaHoraria[] = [];
  cargando = true;
  guardando = false;
  editId: number | null = null;
  feedback = '';
  feedbackOk = false;
  form = {
    diaCongreso: 1,
    etiqueta: '',
    horaInicio: '09:00',
    horaFin: '11:00',
  };

  ngOnInit(): void {
    this.cargar();
  }

  label(f: FranjaHoraria): string {
    return etiquetaFranja(f);
  }

  cargar(): void {
    this.cargando = true;
    this.franjaService.listarAdmin().subscribe({
      next: (items) => {
        this.franjas = items;
        this.cargando = false;
      },
      error: () => {
        this.franjas = [];
        this.cargando = false;
      },
    });
  }

  editar(f: FranjaHoraria): void {
    this.editId = f.id ?? null;
    this.form = {
      diaCongreso: f.diaCongreso,
      etiqueta: f.etiqueta ?? '',
      horaInicio: f.horaInicio,
      horaFin: f.horaFin,
    };
    this.feedback = '';
  }

  cancelar(): void {
    this.editId = null;
    this.form = { diaCongreso: 1, etiqueta: '', horaInicio: '09:00', horaFin: '11:00' };
  }

  guardar(): void {
    if (this.guardando) return;
    this.feedback = '';
    if (!this.form.horaInicio || !this.form.horaFin) {
      this.feedbackOk = false;
      this.feedback = 'Indicá hora de inicio y fin.';
      return;
    }
    this.guardando = true;
    const body = {
      diaCongreso: this.form.diaCongreso,
      etiqueta: this.form.etiqueta.trim() || null,
      horaInicio: this.form.horaInicio,
      horaFin: this.form.horaFin,
      activa: true,
    };
    const req =
      this.editId != null
        ? this.franjaService.modificar(this.editId, body)
        : this.franjaService.crear(body);
    req.subscribe({
      next: () => {
        this.guardando = false;
        this.feedbackOk = true;
        this.feedback = this.editId ? 'Franja actualizada.' : 'Franja creada.';
        this.cancelar();
        this.cargar();
      },
      error: (err) => {
        this.guardando = false;
        this.feedbackOk = false;
        this.feedback = mensajeErrorApi(err, 'No se pudo guardar la franja.');
      },
    });
  }

  desactivar(f: FranjaHoraria): void {
    if (!f.id || this.guardando) return;
    this.guardando = true;
    this.franjaService.desactivar(f.id).subscribe({
      next: () => {
        this.guardando = false;
        this.feedbackOk = true;
        this.feedback = 'Franja desactivada.';
        this.cargar();
      },
      error: (err) => {
        this.guardando = false;
        this.feedbackOk = false;
        this.feedback = mensajeErrorApi(err, 'No se pudo desactivar la franja.');
      },
    });
  }
}
