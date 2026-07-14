import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CongresoConfig } from '../../../models/congreso-config.model';
import { CongresoConfigService } from '../../../servicios/congreso-config.service';
import { mensajeErrorApi } from '../../../utils/api-error.util';

@Component({
  selector: 'app-congreso-certificados-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="panel-page">
      <div class="panel-hero panel-hero--admin">
        <span class="panel-hero-icon" aria-hidden="true">📜</span>
        <div>
          <h1>Certificados</h1>
          <p>Fecha de descarga y finalización del congreso</p>
        </div>
      </div>

      <p class="panel-volver"><a routerLink="/admin/congreso">← Volver a Congreso</a></p>

      @if (error) {
        <p class="error">{{ error }}</p>
      }
      @if (mensaje) {
        <p class="ok">{{ mensaje }}</p>
      }

      <section class="panel-card panel-card--verde">
        <h2>Certificados de asistencia</h2>
        <p class="muted">
          Definí la fecha (inclusive) desde la cual los participantes podrán ver e imprimir el
          certificado.
        </p>
        <div class="inline-form-row">
          <label>
            Habilitar descarga desde
            <input
              type="date"
              [(ngModel)]="certificadosInput"
              [ngModelOptions]="{ standalone: true }"
            />
          </label>
          <button
            type="button"
            class="btn-primary"
            [disabled]="guardandoConfig"
            (click)="guardarCertificados()"
          >
            Guardar fecha
          </button>
          <button
            type="button"
            class="btn-link"
            [disabled]="guardandoConfig"
            (click)="limpiarCertificados()"
          >
            Sin fecha (descarga deshabilitada)
          </button>
        </div>
        <p class="muted small">
          Fecha guardada:
          {{
            config?.certificadosDisponiblesDesde
              ? formatFechaEs(config!.certificadosDisponiblesDesde!)
              : 'ninguna — nadie puede descargar hasta que definas una fecha.'
          }}
        </p>

        <div style="margin-top: 1.25rem; padding-top: 1rem; border-top: 1px solid rgba(0,0,0,0.08)">
          <h3>Finalizar congreso y emitir certificados</h3>
          <p class="muted">
            Al finalizar: habilita la descarga (hoy, si no había fecha o estaba en el futuro), crea
            un registro de certificado para cada inscripción <strong>aprobada</strong> y para
            evaluadores, y avisa por notificación/email. El PDF lo siguen generando las personas
            desde su pantalla imprimible (no se genera en el servidor).
          </p>
          <div class="inline-form-row">
            <button
              type="button"
              class="btn-primary"
              [disabled]="guardandoConfig || finalizandoCertificados"
              (click)="finalizarCongresoCertificados()"
            >
              {{
                finalizandoCertificados
                  ? 'Procesando…'
                  : 'Finalizar congreso / Habilitar certificados'
              }}
            </button>
          </div>
          @if (feedbackCertificados) {
            <p [class]="feedbackCertificadosOk ? 'ok' : 'error'" style="margin-top: 0.5rem">
              {{ feedbackCertificados }}
            </p>
          }
        </div>
      </section>
    </div>
  `,
})
export class CongresoCertificadosAdminComponent implements OnInit {
  config?: CongresoConfig;
  certificadosInput = '';
  guardandoConfig = false;
  finalizandoCertificados = false;
  feedbackCertificados = '';
  feedbackCertificadosOk = false;
  error = '';
  mensaje = '';

  private congresoConfigService = inject(CongresoConfigService);

  ngOnInit(): void {
    this.congresoConfigService.obtener().subscribe({
      next: (c) => {
        this.config = c;
        this.certificadosInput = c.certificadosDisponiblesDesde ?? '';
      },
      error: () => (this.config = undefined),
    });
  }

  guardarCertificados(): void {
    if (this.guardandoConfig) return;
    this.guardandoConfig = true;
    this.congresoConfigService
      .actualizar({ certificadosDisponiblesDesde: this.certificadosInput.trim() || null })
      .subscribe({
        next: (c) => {
          this.config = c;
          this.certificadosInput = c.certificadosDisponiblesDesde ?? '';
          this.guardandoConfig = false;
          this.mensaje = 'Fecha de certificados guardada.';
        },
        error: (err) => {
          this.error = mensajeErrorApi(err, 'No se pudo guardar la fecha.');
          this.guardandoConfig = false;
        },
      });
  }

  limpiarCertificados(): void {
    this.certificadosInput = '';
    this.guardarCertificados();
  }

  finalizarCongresoCertificados(): void {
    if (this.finalizandoCertificados || this.guardandoConfig) return;
    const ok = window.confirm(
      '¿Finalizar el congreso para certificados?\n\n' +
        'Se habilitará la descarga (hoy si corresponde), se registrarán certificados para ' +
        'inscritos aprobados y evaluadores, y se enviarán avisos por notificación/email.'
    );
    if (!ok) return;
    this.finalizandoCertificados = true;
    this.feedbackCertificados = '';
    this.error = '';
    this.congresoConfigService.finalizarCertificados().subscribe({
      next: (r) => {
        this.finalizandoCertificados = false;
        this.feedbackCertificadosOk = true;
        const desde = r.certificadosDisponiblesDesde
          ? this.formatFechaEs(
              typeof r.certificadosDisponiblesDesde === 'string'
                ? r.certificadosDisponiblesDesde.slice(0, 10)
                : String(r.certificadosDisponiblesDesde)
            )
          : 'hoy';
        this.feedbackCertificados =
          `Listo. Descarga desde ${desde}. ` +
          `Nuevos: ${r.certificadosCreados}, ya existían: ${r.certificadosYaExistentes}. ` +
          `Avisos enviados: ${r.notificacionesEnviadas}.`;
        this.mensaje = this.feedbackCertificados;
        this.congresoConfigService.obtener().subscribe({
          next: (c) => {
            this.config = c;
            this.certificadosInput = c.certificadosDisponiblesDesde ?? '';
          },
        });
      },
      error: (err) => {
        this.finalizandoCertificados = false;
        this.feedbackCertificadosOk = false;
        this.feedbackCertificados = mensajeErrorApi(err, 'No se pudo finalizar certificados.');
        this.error = this.feedbackCertificados;
      },
    });
  }

  formatFechaEs(fecha: string): string {
    const [y, m, d] = fecha.split('-');
    return `${d}/${m}/${y}`;
  }
}
