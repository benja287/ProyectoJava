import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CongresoConfigService } from '../../../servicios/congreso-config.service';
import { mensajeErrorApi } from '../../../utils/api-error.util';

@Component({
  selector: 'app-plazo-envio-oc',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  template: `
    <div class="panel-page">
      <div class="panel-hero panel-hero--admin comite-sub-hero">
        <span class="panel-hero-icon" aria-hidden="true">📅</span>
        <div>
          <h1>Límites de envío de trabajos</h1>
          <p>Fecha límite y cantidad máxima de trabajos activos (global)</p>
        </div>
      </div>

      @if (error) {
        <p class="error">{{ error }}</p>
      }
      @if (mensaje) {
        <p class="ok">{{ mensaje }}</p>
      }

      <section class="panel-card comite-deadline">
        <h2>Fecha límite para envíos nuevos</h2>
        <p class="muted">
          Después de esta fecha no se podrán enviar trabajos nuevos (sí reenvíos por corrección).
        </p>
        <div class="comite-deadline-row">
          <input type="date" [formControl]="deadlineCtrl" />
          <button type="button" class="btn-primary" (click)="guardarDeadline()" [disabled]="procesando">
            Guardar fecha
          </button>
          <button type="button" class="btn-secundario" (click)="quitarDeadline()" [disabled]="procesando">
            Quitar fecha
          </button>
        </div>
      </section>

      <section class="panel-card" style="margin-top: 1rem">
        <h2>Cupo global de trabajos activos</h2>
        <p class="muted">
          Aplica a todos. Las excepciones por usuario se gestionan en
          <a routerLink="/organizador/excepciones-cupo">Excepciones de cupo</a>.
        </p>
        <form [formGroup]="cuposForm" class="form-grid" style="max-width: 28rem">
          <label>
            Máx. trabajos como AUTOR
            <input type="number" min="1" max="20" formControlName="maxTrabajosAutor" />
          </label>
          <label>
            Máx. trabajos como ASISTENTE
            <input type="number" min="1" max="20" formControlName="maxTrabajosAsistente" />
          </label>
          <div class="actions span-full">
            <button
              type="button"
              class="btn-primary"
              (click)="guardarCupos()"
              [disabled]="cuposForm.invalid || procesando"
            >
              Guardar cupos globales
            </button>
          </div>
        </form>
      </section>

      <p class="panel-volver">
        <a routerLink="/organizador">← Volver al panel del comité</a>
        <a routerLink="/organizador/excepciones-cupo">Excepciones por usuario</a>
      </p>
    </div>
  `,
})
export class PlazoEnvioOcComponent implements OnInit {
  private fb = inject(FormBuilder);

  procesando = false;
  error = '';
  mensaje = '';
  deadlineCtrl = this.fb.control('');
  cuposForm = this.fb.group({
    maxTrabajosAutor: [2, [Validators.required, Validators.min(1), Validators.max(20)]],
    maxTrabajosAsistente: [1, [Validators.required, Validators.min(1), Validators.max(20)]],
  });

  constructor(private congresoConfigService: CongresoConfigService) {}

  ngOnInit(): void {
    this.congresoConfigService.obtener().subscribe({
      next: (cfg) => {
        if (cfg.envioTrabajosHasta) {
          this.deadlineCtrl.setValue(cfg.envioTrabajosHasta);
        }
        this.cuposForm.patchValue({
          maxTrabajosAutor: cfg.maxTrabajosAutor ?? 2,
          maxTrabajosAsistente: cfg.maxTrabajosAsistente ?? 1,
        });
      },
    });
  }

  guardarDeadline(): void {
    const v = this.deadlineCtrl.value?.trim();
    if (!v) {
      this.error = 'Indicá una fecha o usá Quitar.';
      return;
    }
    this.procesando = true;
    this.error = '';
    this.congresoConfigService.actualizar({ envioTrabajosHasta: v }).subscribe({
      next: () => {
        this.mensaje = `Fecha límite guardada: ${v}.`;
        this.procesando = false;
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'No se pudo guardar la fecha.');
        this.procesando = false;
      },
    });
  }

  quitarDeadline(): void {
    this.procesando = true;
    this.error = '';
    this.congresoConfigService.actualizar({ envioTrabajosHasta: null }).subscribe({
      next: () => {
        this.deadlineCtrl.reset('');
        this.mensaje = 'Se quitó la fecha límite.';
        this.procesando = false;
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'No se pudo quitar la fecha.');
        this.procesando = false;
      },
    });
  }

  guardarCupos(): void {
    if (this.cuposForm.invalid) {
      return;
    }
    const raw = this.cuposForm.getRawValue();
    this.procesando = true;
    this.error = '';
    this.congresoConfigService
      .actualizar({
        grupo: 'CUPOS',
        maxTrabajosAutor: Number(raw.maxTrabajosAutor),
        maxTrabajosAsistente: Number(raw.maxTrabajosAsistente),
      })
      .subscribe({
        next: (cfg) => {
          this.mensaje = `Cupos globales: AUTOR=${cfg.maxTrabajosAutor}, ASISTENTE=${cfg.maxTrabajosAsistente}.`;
          this.procesando = false;
        },
        error: (err) => {
          this.error = mensajeErrorApi(err, 'No se pudieron guardar los cupos.');
          this.procesando = false;
        },
      });
  }
}
