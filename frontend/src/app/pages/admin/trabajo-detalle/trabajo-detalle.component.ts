import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { ArchivoLinkComponent } from '../../../components/archivo-link/archivo-link.component';
import { Trabajo } from '../../../models/trabajo.model';
import { etiquetaEstadoTrabajo } from '../../../models/trabajo-estado-labels';
import { TrabajoService } from '../../../servicios/trabajo.service';
import { mensajeErrorApi } from '../../../utils/api-error.util';
import { etiquetaRolEnvio } from '../../../utils/trabajo-rol.util';

@Component({
  selector: 'app-trabajo-detalle',
  standalone: true,
  imports: [CommonModule, RouterLink, ArchivoLinkComponent],
  template: `
    <div class="panel-page">
      <div class="panel-hero panel-hero--admin">
        <span class="panel-hero-icon" aria-hidden="true">📄</span>
        <div>
          <h1>Detalle de trabajo</h1>
          <p>Datos del envío y acciones de administración</p>
        </div>
      </div>

      <section class="panel-card">
      @if (cargando) {
        <p>Cargando trabajo...</p>
      } @else if (error && !trabajo) {
        <p class="error">{{ error }}</p>
      } @else if (trabajo) {
        <h2>Trabajo #{{ trabajo.id }}</h2>

        @if (error) {
          <p class="error">{{ error }}</p>
        }
        @if (mensaje) {
          <p class="ok">{{ mensaje }}</p>
        }

        <h2>Datos del trabajo</h2>
        <dl class="detalle">
          <dt>Título</dt>
          <dd>{{ trabajo.titulo }}</dd>
          <dt>Estado</dt>
          <dd>{{ etiquetaEstado(trabajo.estado) }}</dd>
          <dt>Tipo</dt>
          <dd>{{ trabajo.tipo || '—' }}</dd>
          <dt>Modalidad</dt>
          <dd>{{ trabajo.modalidad || '—' }}</dd>
          <dt>Eje temático</dt>
          <dd>{{ trabajo.ejeTematico || '—' }}</dd>
          <dt>Rol de envío</dt>
          <dd>{{ etiquetaRol(trabajo) }}</dd>
          <dt>Autor</dt>
          <dd>
            @if (trabajo.autorId) {
              <a [routerLink]="['/admin/usuarios', trabajo.autorId]">
                {{ trabajo.autorApellido }}, {{ trabajo.autorNombre }}
              </a>
            } @else {
              {{ trabajo.autorApellido }}, {{ trabajo.autorNombre }}
            }
          </dd>
          <dt>Coautores</dt>
          <dd>{{ trabajo.coautores?.length ? trabajo.coautores!.join(', ') : '—' }}</dd>
          <dt>Resumen</dt>
          <dd>{{ trabajo.resumen || '—' }}</dd>
          <dt>Metodología</dt>
          <dd>{{ trabajo.metodologia || '—' }}</dd>
          <dt>Precheck</dt>
          <dd>
            Intentos {{ trabajo.precheckIntentos ?? 0 }}/3
            @if (trabajo.observacionesPrecheck) {
              — {{ trabajo.observacionesPrecheck }}
            }
          </dd>
          <dt>Revisiones</dt>
          <dd>{{ trabajo.revisionIntentos ?? 0 }}/2</dd>
          <dt>Documento</dt>
          <dd>
            @if (trabajo.documentoUrl) {
              <app-archivo-link [url]="trabajo.documentoUrl" label="Ver PDF" />
            } @else {
              —
            }
            @if (trabajo.documentoDocxUrl) {
              ·
              <app-archivo-link
                [url]="trabajo.documentoDocxUrl"
                label="Word (.docx)"
                [download]="true"
                downloadName="trabajo.docx"
              />
            }
          </dd>
          <dt>Fecha creación</dt>
          <dd>{{ trabajo.fechaCreacion || '—' }}</dd>
        </dl>

        <h2>Acciones</h2>
        <div class="actions">
          <button type="button" class="btn-warn" (click)="eliminar()" [disabled]="procesando">
            Eliminar trabajo
          </button>
        </div>
      }
      </section>

      <p class="panel-volver"><a routerLink="/admin/trabajos">← Volver al listado</a></p>
    </div>
  `,
})
export class TrabajoDetalleComponent implements OnInit, OnDestroy {
  trabajo?: Trabajo;
  cargando = true;
  error = '';
  mensaje = '';
  procesando = false;
  private sub?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private trabajoService: TrabajoService
  ) {}

  ngOnInit(): void {
    this.sub = this.route.paramMap.subscribe((params) => {
      const id = Number(params.get('id'));
      if (!id) {
        this.error = 'ID inválido';
        this.cargando = false;
        return;
      }
      this.cargar(id);
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  etiquetaEstado(estado?: string): string {
    return etiquetaEstadoTrabajo(estado);
  }

  etiquetaRol(trabajo: Trabajo): string {
    return etiquetaRolEnvio(trabajo);
  }

  eliminar(): void {
    if (!this.trabajo?.id || !confirm(`¿Eliminar trabajo #${this.trabajo.id} "${this.trabajo.titulo}"?`)) {
      return;
    }
    this.procesando = true;
    this.error = '';
    this.mensaje = '';
    this.trabajoService.baja(this.trabajo.id).subscribe({
      next: () => {
        this.router.navigate(['/admin/trabajos']);
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'No se pudo eliminar el trabajo.');
        this.procesando = false;
      },
    });
  }

  private cargar(id: number): void {
    this.cargando = true;
    this.error = '';
    this.mensaje = '';
    this.trabajoService.buscar(id).subscribe({
      next: (t) => {
        this.trabajo = t;
        this.cargando = false;
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'Trabajo no encontrado');
        this.cargando = false;
      },
    });
  }
}
