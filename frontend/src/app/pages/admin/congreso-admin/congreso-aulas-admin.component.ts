import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Aula } from '../../../models/aula.model';
import { AulaService } from '../../../servicios/aula.service';
import { mensajeErrorApi } from '../../../utils/api-error.util';
import { urlMapaAulaCoords } from '../../../utils/aula-mapa.util';

@Component({
  selector: 'app-congreso-aulas-admin',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="panel-page">
      <div class="panel-hero panel-hero--admin">
        <span class="panel-hero-icon" aria-hidden="true">📍</span>
        <div>
          <h1>Aulas</h1>
          <p>Recursos físicos del evento</p>
        </div>
      </div>

      <p class="panel-volver"><a routerLink="/admin/congreso">← Volver a Congreso</a></p>

      @if (feedback) {
        <p [class]="feedbackOk ? 'ok' : 'error'">{{ feedback }}</p>
      }

      <div class="inline-form-row aulas-toolbar">
        <a routerLink="/admin/congreso/aulas/nueva" class="btn-primary">Crear nueva aula</a>
      </div>

      <section class="panel-card aulas-lista-card">
        <h2>Listado de aulas</h2>
        <p class="muted">
          Al programar actividades se elige un aula; se controlan choques de horario. La ubicación en
          el mapa se carga al crear o editar el aula.
        </p>

        @if (cargando) {
          <p class="muted">Cargando aulas...</p>
        } @else if (aulas.length) {
          <div class="aulas-tabla-wrap">
            <table class="tabla-simple aulas-tabla">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Capacidad</th>
                  <th>Ubicación</th>
                  <th>Mapa</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (a of aulas; track a.id) {
                  <tr>
                    <td>{{ a.nombre }}</td>
                    <td>{{ a.capacidad ?? '—' }}</td>
                    <td>{{ a.ubicacion || '—' }}</td>
                    <td>
                      @if (linkVerMapa(a); as url) {
                        <a [href]="url" target="_blank" rel="noopener noreferrer">
                          Ver ubicación en el mapa
                        </a>
                      } @else {
                        <span class="muted">Sin ubicación en el mapa</span>
                      }
                    </td>
                    <td>{{ a.activa ? 'Activa' : 'Inactiva' }}</td>
                    <td>
                      <div class="aulas-acciones">
                        <a class="btn-link" [routerLink]="['/admin/congreso/aulas', a.id]">Editar</a>
                        @if (a.activa) {
                          <button
                            type="button"
                            class="btn-link"
                            [disabled]="procesandoId === a.id"
                            (click)="desactivarAula(a)"
                          >
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
        } @else {
          <p class="muted">Todavía no hay aulas cargadas.</p>
        }
      </section>
    </div>
  `,
  styles: [
    `
      .aulas-toolbar {
        margin-bottom: 1rem;
      }
      .aulas-lista-card {
        margin-top: 0.25rem;
      }
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
export class CongresoAulasAdminComponent implements OnInit {
  aulas: Aula[] = [];
  cargando = true;
  feedback = '';
  feedbackOk = false;
  procesandoId?: number;

  private aulaService = inject(AulaService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  ngOnInit(): void {
    // Compat: ?editarAula=id → formulario de edición
    const editarAula = this.route.snapshot.queryParamMap.get('editarAula');
    if (editarAula) {
      const id = Number(editarAula);
      if (Number.isFinite(id)) {
        void this.router.navigate(['/admin/congreso/aulas', id], { replaceUrl: true });
        return;
      }
    }

    const st = history.state as { mensaje?: string } | null;
    if (st?.mensaje) {
      this.feedback = st.mensaje;
      this.feedbackOk = true;
      history.replaceState({}, '');
    }

    this.cargarAulas();
  }

  cargarAulas(): void {
    this.cargando = true;
    this.aulaService.listarAdmin().subscribe({
      next: (items) => {
        this.aulas = items;
        this.cargando = false;
      },
      error: () => {
        this.aulas = [];
        this.cargando = false;
      },
    });
  }

  linkVerMapa(a: Aula): string | null {
    return urlMapaAulaCoords(a);
  }

  desactivarAula(a: Aula): void {
    if (!a.id || this.procesandoId) return;
    this.procesandoId = a.id;
    this.aulaService.desactivar(a.id).subscribe({
      next: () => {
        this.procesandoId = undefined;
        this.feedbackOk = true;
        this.feedback = `Aula "${a.nombre}" desactivada.`;
        this.cargarAulas();
      },
      error: (err) => {
        this.procesandoId = undefined;
        this.feedbackOk = false;
        this.feedback = mensajeErrorApi(err, 'No se pudo desactivar el aula.');
      },
    });
  }
}
