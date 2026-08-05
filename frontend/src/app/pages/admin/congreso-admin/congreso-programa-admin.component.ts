import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CongresoConfig } from '../../../models/congreso-config.model';
import { CongresoConfigService } from '../../../servicios/congreso-config.service';
import { mensajeErrorApi } from '../../../utils/api-error.util';
import { CronogramaCongresoAdminComponent } from '../cronograma-congreso/cronograma-congreso-admin.component';
import { CongresoProgramaGuiaComponent } from './congreso-programa-guia.component';

@Component({
  selector: 'app-congreso-programa-admin',
  standalone: true,
  imports: [CommonModule, RouterLink, CronogramaCongresoAdminComponent, CongresoProgramaGuiaComponent],
  template: `
    <div class="panel-page">
      <div class="panel-hero panel-hero--admin">
        <span class="panel-hero-icon" aria-hidden="true">🗓</span>
        <div>
          <h1>Programa</h1>
          <p>Se refleja lo que vas creando: publicación y cronograma</p>
        </div>
      </div>

      <p class="panel-volver"><a routerLink="/admin/congreso">← Volver a Congreso</a></p>
      <!-- pasoActual 5 = todos los pasos hechos; links siguen yendo a 1–4 -->
      <app-congreso-programa-guia [pasoActual]="5" />

      @if (error) {
        <p class="error">{{ error }}</p>
      }
      @if (mensaje) {
        <p class="ok">{{ mensaje }}</p>
      }

      <section class="panel-card panel-card--indigo">
        <div class="panel-card-header-row">
          <div>
            <h2>Programa del congreso</h2>
            <p class="muted">
              Controlá si el programa está visible para el público. Mientras esté "No publicado",
              los visitantes verán un aviso de que aún no fue publicado.
            </p>
          </div>
          <button
            type="button"
            class="toggle-btn"
            [class.toggle-btn--on]="config?.programaPublicado"
            [disabled]="guardandoConfig || !config"
            (click)="togglePrograma()"
          >
            {{ config?.programaPublicado ? 'Publicado' : 'No publicado' }}
          </button>
        </div>
        @if (config && !config.programaPublicado) {
          <p class="notice-box notice-box--amber">
            El cronograma ya está cargado en admin, pero el público aún no lo ve. Hacé clic en
            <strong>Publicar programa</strong> para que aparezca en la cabecera → Programa.
          </p>
          <button
            type="button"
            class="btn-primary"
            [disabled]="guardandoConfig"
            (click)="publicarPrograma()"
          >
            Publicar programa ahora
          </button>
        } @else if (config?.programaPublicado) {
          <p class="ok">El programa está visible para todos en <strong>Programa</strong>.</p>
        } @else {
          <p class="notice-box notice-box--amber">
            No se pudo leer el estado de publicación.
            <button type="button" class="btn-secundario" (click)="cargarConfig()">Reintentar</button>
          </p>
        }
      </section>

      <section class="panel-card" id="cronograma-congreso">
        <h2>Cronograma del congreso</h2>
        <p class="muted">Mesas temáticas, pósters, talleres y conferencias programadas.</p>
        <app-cronograma-congreso-admin />
      </section>
    </div>
  `,
})
export class CongresoProgramaAdminComponent implements OnInit {
  config?: CongresoConfig;
  guardandoConfig = false;
  error = '';
  mensaje = '';

  private congresoConfigService = inject(CongresoConfigService);

  ngOnInit(): void {
    this.cargarConfig();
  }

  cargarConfig(): void {
    this.congresoConfigService.obtener().subscribe({
      next: (c) => {
        this.config = c;
        this.error = '';
      },
      error: (err) => {
        this.config = undefined;
        this.error = mensajeErrorApi(err, 'No se pudo cargar la configuración del congreso.');
      },
    });
  }

  togglePrograma(): void {
    if (!this.config || this.guardandoConfig) return;
    this.actualizarProgramaPublicado(!this.config.programaPublicado);
  }

  publicarPrograma(): void {
    if (!this.config || this.guardandoConfig || this.config.programaPublicado) return;
    this.actualizarProgramaPublicado(true);
  }

  private actualizarProgramaPublicado(publicado: boolean): void {
    this.guardandoConfig = true;
    this.congresoConfigService.actualizar({ programaPublicado: publicado }).subscribe({
      next: (c) => {
        this.config = c;
        this.guardandoConfig = false;
        this.mensaje = c.programaPublicado
          ? 'El programa quedó publicado. Abrí Programa en la cabecera para verificar.'
          : 'El programa quedó como no publicado.';
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'No se pudo actualizar el programa.');
        this.guardandoConfig = false;
      },
    });
  }
}
