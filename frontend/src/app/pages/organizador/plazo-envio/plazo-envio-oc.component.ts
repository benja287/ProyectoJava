import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CongresoConfigService } from '../../../servicios/congreso-config.service';
import { mensajeErrorApi } from '../../../utils/api-error.util';

@Component({
  selector: 'app-plazo-envio-oc',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  template: `
    <div class="panel-page">
      <div class="panel-hero panel-hero--indigo">
        <span class="panel-hero-icon" aria-hidden="true">📅</span>
        <div>
          <h1>Límite para envíos nuevos</h1>
          <p>Fecha límite para envíos nuevos de trabajos</p>
        </div>
      </div>

      @if (error) {
        <p class="error">{{ error }}</p>
      }
      @if (mensaje) {
        <p class="ok">{{ mensaje }}</p>
      }

      <section class="panel-card comite-deadline">
        <h2>Límite para envíos nuevos de trabajos</h2>
        <p class="muted">Después de esta fecha, no se podrán enviar trabajos nuevos (sí reenvíos por corrección).</p>
        <div class="comite-deadline-row">
          <input type="date" [formControl]="deadlineCtrl" />
          <button type="button" class="btn-primary" (click)="guardarDeadline()" [disabled]="procesando">
            Guardar
          </button>
          <button type="button" class="btn-secundario" (click)="quitarDeadline()" [disabled]="procesando">
            Quitar
          </button>
        </div>
      </section>

      <p><a routerLink="/organizador">← Volver al panel del comité</a></p>
    </div>
  `,
})
export class PlazoEnvioOcComponent implements OnInit {
  private fb = inject(FormBuilder);

  procesando = false;
  error = '';
  mensaje = '';
  deadlineCtrl = this.fb.control('');

  constructor(private congresoConfigService: CongresoConfigService) {}

  ngOnInit(): void {
    this.congresoConfigService.obtener().subscribe({
      next: (cfg) => {
        if (cfg.envioTrabajosHasta) {
          this.deadlineCtrl.setValue(cfg.envioTrabajosHasta);
        }
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
}
