import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SolicitudAutor } from '../../../models/solicitud-autor.model';
import { etiquetaEstadoTrabajo as labelEstadoTrabajo } from '../../../models/trabajo-estado-labels';
import { AdminStatsService } from '../../../servicios/admin-stats.service';
import { UsuarioService } from '../../../servicios/usuario.service';
import { mensajeErrorApi } from '../../../utils/api-error.util';

@Component({
  selector: 'app-solicitudes-autor-admin',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="panel-page">
      <div class="panel-hero panel-hero--admin">
        <span class="panel-hero-icon" aria-hidden="true">✍</span>
        <div>
          <h1>Solicitudes para ser Autor</h1>
          <p>Habilitá el rol autor a asistentes con trabajos aprobados</p>
        </div>
      </div>

      <p class="panel-volver"><a routerLink="/admin">← Volver al panel</a></p>

      @if (error) {
        <p class="error">{{ error }}</p>
      }

      <section class="panel-card panel-card--verde">
        <h2>Solicitudes para ser Autor</h2>
        <p class="muted">
          Acá aparecen solo asistentes con al menos un trabajo
          <strong>aprobado</strong> por evaluadores (2 aprobaciones) y pendientes de habilitación
          del rol autor.
        </p>
        @if (solicitudesAutorFeedback) {
          <p class="ok">{{ solicitudesAutorFeedback }}</p>
        }
        @if (cargandoSolicitudesAutor) {
          <p class="muted">Cargando solicitudes...</p>
        } @else if (solicitudesAutor.length === 0) {
          <p class="muted dashed-box">No hay solicitudes pendientes.</p>
        } @else {
          <div class="solicitudes-autor-lista">
            @for (s of solicitudesAutor; track s.usuarioId) {
              <article class="solicitud-autor-card">
                <div>
                  <strong>{{ s.nombre }} {{ s.apellido }}</strong>
                  <p class="muted small">{{ s.email }}</p>
                  <p class="solicitud-autor-trabajos-titulo">Trabajos aprobados:</p>
                  <ul class="solicitud-autor-trabajos">
                    @for (t of s.trabajos; track t.id) {
                      <li>
                        <span class="solicitud-autor-trabajo-titulo">{{ t.titulo }}</span>
                        <span class="muted small">
                          — {{ t.ejeTematico || '—' }} —
                          {{ etiquetaTipoTrabajo(t.tipo) }}
                          @if (t.estado) {
                            ({{ etiquetaEstadoTrabajo(t.estado) }})
                          }
                        </span>
                      </li>
                    }
                  </ul>
                </div>
                <button
                  type="button"
                  class="btn-ok"
                  [disabled]="procesandoAutorId === s.usuarioId"
                  (click)="habilitarAutor(s)"
                >
                  Habilitar rol Autor
                </button>
              </article>
            }
          </div>
        }
      </section>
    </div>
  `,
})
export class SolicitudesAutorAdminComponent implements OnInit {
  private statsService = inject(AdminStatsService);
  private usuarioService = inject(UsuarioService);

  solicitudesAutor: SolicitudAutor[] = [];
  solicitudesAutorFeedback = '';
  error = '';
  cargandoSolicitudesAutor = true;
  procesandoAutorId?: number;

  ngOnInit(): void {
    this.cargarSolicitudesAutor();
  }

  etiquetaTipoTrabajo(tipo?: string): string {
    const map: Record<string, string> = {
      TRABAJO_CIENTIFICO: 'Científico',
      RELATO_DE_EXPERIENCIA: 'Relato de experiencia',
    };
    return tipo ? map[tipo] ?? tipo : '—';
  }

  etiquetaEstadoTrabajo(estado: string): string {
    return labelEstadoTrabajo(estado);
  }

  habilitarAutor(solicitud: SolicitudAutor): void {
    if (
      !confirm(
        `¿Habilitar rol Autor para ${solicitud.nombre} ${solicitud.apellido}?`
      )
    ) {
      return;
    }
    this.procesandoAutorId = solicitud.usuarioId;
    this.solicitudesAutorFeedback = '';
    this.error = '';
    this.usuarioService.promoverAutor(solicitud.usuarioId).subscribe({
      next: () => {
        this.solicitudesAutorFeedback = `Se habilitó el rol autor para ${solicitud.nombre} ${solicitud.apellido}.`;
        this.procesandoAutorId = undefined;
        this.cargarSolicitudesAutor();
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'No se pudo habilitar el rol autor.');
        this.procesandoAutorId = undefined;
      },
    });
  }

  private cargarSolicitudesAutor(): void {
    this.statsService.solicitudesAutor().subscribe({
      next: (items) => {
        this.solicitudesAutor = items;
        this.cargandoSolicitudesAutor = false;
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'No se pudieron cargar las solicitudes de autor.');
        this.cargandoSolicitudesAutor = false;
      },
    });
  }
}
