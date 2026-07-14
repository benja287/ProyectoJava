import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CongresoConfig } from '../../../models/congreso-config.model';
import { CongresoConfigService } from '../../../servicios/congreso-config.service';
import { mensajeErrorApi } from '../../../utils/api-error.util';
import { finCongresoDesdeInicio } from '../../../constants/congress-event';

@Component({
  selector: 'app-congreso-fechas-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="panel-page">
      <div class="panel-hero panel-hero--admin">
        <span class="panel-hero-icon" aria-hidden="true">⏱</span>
        <div>
          <h1>Ventanas de tiempo</h1>
          <p>Fechas del evento, inscripción, envío y evaluación</p>
        </div>
      </div>

      <p class="panel-volver"><a routerLink="/admin/congreso">← Volver a Congreso</a></p>

      <section class="panel-card panel-card--indigo">
        <h2>Ventanas de tiempo del congreso</h2>
        <p class="muted">
          Cada bloque se guarda y notifica por separado. El congreso dura
          <strong>3 días corridos</strong> (día 1 = inicio, día 3 = fin automático).
        </p>

        <div class="panel-card" style="margin-top: 0.75rem; box-shadow: none">
          <h3>1. Inicio y fin del congreso</h3>
          <p class="muted small">
            Notifica a todos. Al guardar, el programa (día 1/2/3) se reacomoda a las nuevas fechas.
          </p>
          <div class="form-grid form-grid-wide">
            <label>
              Inicio del congreso (día 1)
              <input
                type="date"
                [(ngModel)]="ventanas.congresoDesde"
                [ngModelOptions]="{ standalone: true }"
                (ngModelChange)="onCongresoDesdeChange($event)"
              />
            </label>
            <label>
              Fin del congreso (día 3, automático)
              <input
                type="date"
                [ngModel]="ventanas.congresoHasta"
                [ngModelOptions]="{ standalone: true }"
                disabled
              />
            </label>
            <label class="span-full">
              Motivo del cambio
              <input
                type="text"
                [(ngModel)]="motivoCongreso"
                [ngModelOptions]="{ standalone: true }"
                placeholder="Ej. Postergación por causas climáticas"
              />
            </label>
          </div>
          <div class="inline-form-row" style="margin-top: 0.75rem">
            <button
              type="button"
              class="btn-primary"
              [disabled]="guardandoVentana === 'CONGRESO'"
              (click)="guardarBloqueCongreso()"
            >
              {{ guardandoVentana === 'CONGRESO' ? 'Guardando...' : 'Guardar fechas del congreso' }}
            </button>
          </div>
          @if (feedbackCongreso) {
            <p [class]="feedbackCongresoOk ? 'ok' : 'error'" style="margin-top: 0.5rem">
              {{ feedbackCongreso }}
            </p>
          }
        </div>

        <div class="panel-card" style="margin-top: 0.75rem; box-shadow: none">
          <h3>2. Período de inscripción</h3>
          <p class="muted small">Notifica solo por este cambio (a todos).</p>
          <div class="form-grid form-grid-wide">
            <label>
              Inscripciones desde
              <input
                type="date"
                [(ngModel)]="ventanas.inscripcionesDesde"
                [ngModelOptions]="{ standalone: true }"
              />
            </label>
            <label>
              Inscripciones hasta
              <input
                type="date"
                [(ngModel)]="ventanas.inscripcionesHasta"
                [ngModelOptions]="{ standalone: true }"
              />
            </label>
            <label class="span-full">
              Motivo del cambio
              <input
                type="text"
                [(ngModel)]="motivoInscripciones"
                [ngModelOptions]="{ standalone: true }"
                placeholder="Ej. Se amplía el plazo de inscripción"
              />
            </label>
          </div>
          <div class="inline-form-row" style="margin-top: 0.75rem">
            <button
              type="button"
              class="btn-primary"
              [disabled]="guardandoVentana === 'INSCRIPCIONES'"
              (click)="guardarBloqueInscripciones()"
            >
              {{
                guardandoVentana === 'INSCRIPCIONES'
                  ? 'Guardando...'
                  : 'Guardar período de inscripción'
              }}
            </button>
          </div>
          @if (feedbackInscripciones) {
            <p [class]="feedbackInscripcionesOk ? 'ok' : 'error'" style="margin-top: 0.5rem">
              {{ feedbackInscripciones }}
            </p>
          }
        </div>

        <div class="panel-card" style="margin-top: 0.75rem; box-shadow: none">
          <h3>3. Plazo de envío de trabajos</h3>
          <p class="muted small">Notifica a asistentes y autores.</p>
          <div class="form-grid form-grid-wide">
            <label>
              Envío de trabajos hasta
              <input
                type="date"
                [(ngModel)]="ventanas.envioTrabajosHasta"
                [ngModelOptions]="{ standalone: true }"
              />
            </label>
            <label class="span-full">
              Motivo del cambio
              <input
                type="text"
                [(ngModel)]="motivoEnvio"
                [ngModelOptions]="{ standalone: true }"
                placeholder="Ej. Se extiende el plazo de envío"
              />
            </label>
          </div>
          <div class="inline-form-row" style="margin-top: 0.75rem">
            <button
              type="button"
              class="btn-primary"
              [disabled]="guardandoVentana === 'ENVIO'"
              (click)="guardarBloqueEnvio()"
            >
              {{ guardandoVentana === 'ENVIO' ? 'Guardando...' : 'Guardar plazo de envío' }}
            </button>
          </div>
          @if (feedbackEnvio) {
            <p [class]="feedbackEnvioOk ? 'ok' : 'error'" style="margin-top: 0.5rem">
              {{ feedbackEnvio }}
            </p>
          }
        </div>

        <div class="panel-card" style="margin-top: 0.75rem; box-shadow: none">
          <h3>4. Plazo de evaluación</h3>
          <p class="muted small">Notifica solo a evaluadores.</p>
          <div class="form-grid form-grid-wide">
            <label>
              Evaluación hasta
              <input
                type="date"
                [(ngModel)]="ventanas.evaluacionHasta"
                [ngModelOptions]="{ standalone: true }"
              />
            </label>
            <label class="span-full">
              Motivo del cambio
              <input
                type="text"
                [(ngModel)]="motivoEvaluacion"
                [ngModelOptions]="{ standalone: true }"
                placeholder="Ej. Se extiende el plazo de evaluación"
              />
            </label>
          </div>
          <div class="inline-form-row" style="margin-top: 0.75rem">
            <button
              type="button"
              class="btn-primary"
              [disabled]="guardandoVentana === 'EVALUACION'"
              (click)="guardarBloqueEvaluacion()"
            >
              {{
                guardandoVentana === 'EVALUACION' ? 'Guardando...' : 'Guardar plazo de evaluación'
              }}
            </button>
          </div>
          @if (feedbackEvaluacion) {
            <p [class]="feedbackEvaluacionOk ? 'ok' : 'error'" style="margin-top: 0.5rem">
              {{ feedbackEvaluacion }}
            </p>
          }
        </div>

        <p class="muted small" style="margin-top: 0.75rem">
          El comité también puede editar solo la fecha límite de envío de trabajos desde su panel.
        </p>
      </section>
    </div>
  `,
})
export class CongresoFechasAdminComponent implements OnInit {
  ventanas = {
    congresoDesde: '',
    congresoHasta: '',
    inscripcionesDesde: '',
    inscripcionesHasta: '',
    envioTrabajosHasta: '',
    evaluacionHasta: '',
  };
  motivoCongreso = '';
  motivoInscripciones = '';
  motivoEnvio = '';
  motivoEvaluacion = '';
  feedbackCongreso = '';
  feedbackCongresoOk = false;
  feedbackInscripciones = '';
  feedbackInscripcionesOk = false;
  feedbackEnvio = '';
  feedbackEnvioOk = false;
  feedbackEvaluacion = '';
  feedbackEvaluacionOk = false;
  guardandoVentana: '' | 'CONGRESO' | 'INSCRIPCIONES' | 'ENVIO' | 'EVALUACION' = '';

  private congresoConfigService = inject(CongresoConfigService);

  ngOnInit(): void {
    this.congresoConfigService.obtener().subscribe({
      next: (c) => this.aplicarVentanasDesdeConfig(c),
    });
  }

  onCongresoDesdeChange(desde: string): void {
    this.ventanas.congresoDesde = desde ?? '';
    this.ventanas.congresoHasta = desde ? finCongresoDesdeInicio(desde) : '';
  }

  guardarBloqueCongreso(): void {
    if (this.guardandoVentana) return;
    this.feedbackCongreso = '';
    if (!this.ventanas.congresoDesde.trim()) {
      this.feedbackCongreso = 'Indicá la fecha de inicio del congreso.';
      this.feedbackCongresoOk = false;
      return;
    }
    if (!this.motivoCongreso.trim()) {
      this.feedbackCongreso = 'Indicá el motivo del cambio.';
      this.feedbackCongresoOk = false;
      return;
    }
    const hasta = finCongresoDesdeInicio(this.ventanas.congresoDesde.trim());
    this.ventanas.congresoHasta = hasta;
    this.guardandoVentana = 'CONGRESO';
    this.congresoConfigService
      .actualizar({
        grupo: 'CONGRESO',
        congresoDesde: this.ventanas.congresoDesde.trim(),
        congresoHasta: hasta,
        motivo: this.motivoCongreso.trim(),
      })
      .subscribe({
        next: (c) => {
          this.aplicarVentanasDesdeConfig(c);
          this.guardandoVentana = '';
          this.feedbackCongresoOk = true;
          this.feedbackCongreso =
            'Fechas del congreso guardadas (3 días). El programa se reacomodó por día lógico.' +
            ' Se notificó a todos. Si había plazos posteriores al nuevo fin, se ajustaron.';
        },
        error: (err) => {
          this.guardandoVentana = '';
          this.feedbackCongresoOk = false;
          this.feedbackCongreso = mensajeErrorApi(
            err,
            'No se pudieron guardar las fechas del congreso.'
          );
        },
      });
  }

  guardarBloqueInscripciones(): void {
    if (this.guardandoVentana) return;
    this.feedbackInscripciones = '';
    if (!this.motivoInscripciones.trim()) {
      this.feedbackInscripciones = 'Indicá el motivo del cambio.';
      this.feedbackInscripcionesOk = false;
      return;
    }
    this.guardandoVentana = 'INSCRIPCIONES';
    this.congresoConfigService
      .actualizar({
        grupo: 'INSCRIPCIONES',
        inscripcionesDesde: this.ventanas.inscripcionesDesde.trim() || '',
        inscripcionesHasta: this.ventanas.inscripcionesHasta.trim() || '',
        motivo: this.motivoInscripciones.trim(),
      })
      .subscribe({
        next: (c) => {
          this.aplicarVentanasDesdeConfig(c);
          this.guardandoVentana = '';
          this.feedbackInscripcionesOk = true;
          this.feedbackInscripciones =
            'Período de inscripción guardado. Se notificó a todos.';
        },
        error: (err) => {
          this.guardandoVentana = '';
          this.feedbackInscripcionesOk = false;
          this.feedbackInscripciones = mensajeErrorApi(
            err,
            'No se pudo guardar el período de inscripción.'
          );
        },
      });
  }

  guardarBloqueEnvio(): void {
    if (this.guardandoVentana) return;
    this.feedbackEnvio = '';
    if (!this.motivoEnvio.trim()) {
      this.feedbackEnvio = 'Indicá el motivo del cambio.';
      this.feedbackEnvioOk = false;
      return;
    }
    this.guardandoVentana = 'ENVIO';
    this.congresoConfigService
      .actualizar({
        grupo: 'ENVIO',
        envioTrabajosHasta: this.ventanas.envioTrabajosHasta.trim() || '',
        motivo: this.motivoEnvio.trim(),
      })
      .subscribe({
        next: (c) => {
          this.aplicarVentanasDesdeConfig(c);
          this.guardandoVentana = '';
          this.feedbackEnvioOk = true;
          this.feedbackEnvio =
            'Plazo de envío guardado. Se notificó a asistentes y autores.';
        },
        error: (err) => {
          this.guardandoVentana = '';
          this.feedbackEnvioOk = false;
          this.feedbackEnvio = mensajeErrorApi(err, 'No se pudo guardar el plazo de envío.');
        },
      });
  }

  guardarBloqueEvaluacion(): void {
    if (this.guardandoVentana) return;
    this.feedbackEvaluacion = '';
    if (!this.motivoEvaluacion.trim()) {
      this.feedbackEvaluacion = 'Indicá el motivo del cambio.';
      this.feedbackEvaluacionOk = false;
      return;
    }
    this.guardandoVentana = 'EVALUACION';
    this.congresoConfigService
      .actualizar({
        grupo: 'EVALUACION',
        evaluacionHasta: this.ventanas.evaluacionHasta.trim() || '',
        motivo: this.motivoEvaluacion.trim(),
      })
      .subscribe({
        next: (c) => {
          this.aplicarVentanasDesdeConfig(c);
          this.guardandoVentana = '';
          this.feedbackEvaluacionOk = true;
          this.feedbackEvaluacion =
            'Plazo de evaluación guardado. Se notificó a evaluadores.';
        },
        error: (err) => {
          this.guardandoVentana = '';
          this.feedbackEvaluacionOk = false;
          this.feedbackEvaluacion = mensajeErrorApi(
            err,
            'No se pudo guardar el plazo de evaluación.'
          );
        },
      });
  }

  private aplicarVentanasDesdeConfig(c: CongresoConfig): void {
    this.ventanas = {
      congresoDesde: c.congresoDesde ?? '',
      congresoHasta: c.congresoHasta ?? '',
      inscripcionesDesde: c.inscripcionesDesde ?? '',
      inscripcionesHasta: c.inscripcionesHasta ?? '',
      envioTrabajosHasta: c.envioTrabajosHasta ?? '',
      evaluacionHasta: c.evaluacionHasta ?? '',
    };
  }
}
