import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Aula } from '../../../models/aula.model';
import { AulaService } from '../../../servicios/aula.service';
import { mensajeErrorApi } from '../../../utils/api-error.util';
import { urlMapaAulaCoords } from '../../../utils/aula-mapa.util';
import { CongresoProgramaGuiaComponent } from './congreso-programa-guia.component';

@Component({
  selector: 'app-congreso-aulas-admin',
  standalone: true,
  imports: [CommonModule, RouterLink, CongresoProgramaGuiaComponent],
  template: `
    <div class="panel-page">
      <div class="panel-hero panel-hero--admin">
        <span class="panel-hero-icon" aria-hidden="true">📍</span>
        <div>
          <h1>Paso 3 · Aulas</h1>
          <p>Recursos físicos del evento</p>
        </div>
      </div>

      <p class="panel-volver"><a routerLink="/admin/congreso">← Volver a Congreso</a></p>
      <app-congreso-programa-guia [pasoActual]="3" />

      @if (feedback) {
        <p [class]="feedbackOk ? 'ok' : 'error'">{{ feedback }}</p>
      }

      <div class="aulas-toolbar">
        <a routerLink="/admin/congreso/aulas/nueva" class="aulas-btn-crear">
          <span aria-hidden="true">＋</span>
          Crear nueva aula
        </a>
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
            <table class="aulas-tabla">
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
                  <tr [class.aulas-fila--inactiva]="!a.activa">
                    <td class="aulas-td-nombre">{{ a.nombre }}</td>
                    <td>
                      <span class="aulas-capacidad">{{ a.capacidad ?? '—' }}</span>
                    </td>
                    <td>{{ a.ubicacion || '—' }}</td>
                    <td>
                      @if (linkVerMapa(a); as url) {
                        <a
                          class="aulas-mapa-link"
                          [href]="url"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Ver en mapa
                        </a>
                      } @else {
                        <span class="aulas-sin-mapa">Sin mapa</span>
                      }
                    </td>
                    <td>
                      <span
                        class="aulas-estado"
                        [class.aulas-estado--activa]="a.activa"
                        [class.aulas-estado--inactiva]="!a.activa"
                      >
                        {{ a.activa ? 'Activa' : 'Inactiva' }}
                      </span>
                    </td>
                    <td>
                      <div class="aulas-acciones">
                        <a
                          class="aulas-accion aulas-accion--editar"
                          [routerLink]="['/admin/congreso/aulas', a.id]"
                        >
                          Editar
                        </a>
                        @if (a.activa) {
                          <button
                            type="button"
                            class="aulas-accion aulas-accion--desactivar"
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
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        margin-bottom: 0.35rem;
      }
      .aulas-btn-crear {
        display: inline-flex;
        align-items: center;
        gap: 0.45rem;
        padding: 0.7rem 1.25rem;
        border: 2px solid rgba(45, 106, 62, 0.85);
        border-radius: 12px;
        background: linear-gradient(145deg, #2d6a3e, #1a4d2e);
        color: #fff !important;
        font-weight: 700;
        font-size: 0.95rem;
        text-decoration: none;
        box-shadow:
          0 10px 22px rgba(7, 31, 17, 0.22),
          0 0 0 1px rgba(226, 255, 217, 0.35),
          0 1px 0 rgba(255, 255, 255, 0.2) inset;
        transition:
          transform 0.15s ease,
          box-shadow 0.15s ease,
          filter 0.15s ease;
      }
      .aulas-btn-crear:hover {
        filter: brightness(1.06);
        transform: translateY(-1px);
        box-shadow:
          0 14px 28px rgba(7, 31, 17, 0.28),
          0 0 0 1px rgba(226, 255, 217, 0.45);
      }
      .aulas-lista-card {
        margin-top: 0.25rem;
      }
      .aulas-tabla-wrap {
        margin-top: 1rem;
        overflow-x: auto;
        border: 2px solid rgba(104, 176, 113, 0.55);
        border-radius: 16px;
        background: rgba(255, 255, 255, 0.88);
        box-shadow:
          0 10px 24px rgba(7, 31, 17, 0.1),
          0 1px 0 rgba(255, 255, 255, 0.8) inset;
      }
      .aulas-tabla {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
        min-width: 720px;
      }
      .aulas-tabla thead th {
        position: sticky;
        top: 0;
        z-index: 1;
        text-align: left;
        padding: 0.85rem 1rem;
        font-size: 0.72rem;
        font-weight: 750;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: #2d5f3d;
        background: linear-gradient(180deg, #eaf6e6, #dcefd6);
        border-bottom: 2px solid rgba(104, 176, 113, 0.45);
      }
      .aulas-tabla thead th:first-child {
        border-top-left-radius: 14px;
      }
      .aulas-tabla thead th:last-child {
        border-top-right-radius: 14px;
      }
      .aulas-tabla tbody td {
        padding: 0.95rem 1rem;
        vertical-align: middle;
        color: #1e3326;
        border-bottom: 1px solid rgba(104, 176, 113, 0.2);
        background: transparent;
      }
      .aulas-tabla tbody tr:last-child td {
        border-bottom: none;
      }
      .aulas-tabla tbody tr:nth-child(even) td {
        background: rgba(232, 246, 228, 0.45);
      }
      .aulas-tabla tbody tr:hover td {
        background: rgba(210, 236, 200, 0.55);
      }
      .aulas-fila--inactiva td {
        opacity: 0.72;
      }
      .aulas-td-nombre {
        font-weight: 700;
        color: #102d1c;
      }
      .aulas-capacidad {
        display: inline-flex;
        min-width: 2.4rem;
        justify-content: center;
        padding: 0.2rem 0.55rem;
        border-radius: 999px;
        background: rgba(125, 207, 122, 0.22);
        border: 1px solid rgba(104, 176, 113, 0.4);
        font-weight: 700;
        color: #174e2a;
      }
      .aulas-mapa-link {
        display: inline-flex;
        padding: 0.28rem 0.65rem;
        border-radius: 999px;
        border: 1px solid rgba(104, 176, 113, 0.45);
        background: rgba(242, 249, 238, 0.95);
        color: #174e2a !important;
        font-size: 0.82rem;
        font-weight: 650;
        text-decoration: none;
      }
      .aulas-mapa-link:hover {
        background: #fff;
        border-color: rgba(72, 156, 90, 0.75);
      }
      .aulas-sin-mapa {
        color: #6b7a70;
        font-size: 0.85rem;
      }
      .aulas-estado {
        display: inline-flex;
        padding: 0.25rem 0.65rem;
        border-radius: 999px;
        font-size: 0.78rem;
        font-weight: 750;
        letter-spacing: 0.02em;
      }
      .aulas-estado--activa {
        background: rgba(125, 207, 122, 0.28);
        color: #14532d;
        border: 1px solid rgba(72, 156, 90, 0.45);
      }
      .aulas-estado--inactiva {
        background: rgba(148, 163, 156, 0.2);
        color: #4b5563;
        border: 1px solid rgba(120, 130, 125, 0.35);
      }
      .aulas-acciones {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.4rem;
      }
      .aulas-accion {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0.35rem 0.75rem;
        border-radius: 999px;
        font: inherit;
        font-size: 0.82rem;
        font-weight: 700;
        text-decoration: none;
        cursor: pointer;
        border: 1.5px solid transparent;
        transition:
          background 0.15s ease,
          border-color 0.15s ease;
      }
      .aulas-accion--editar {
        background: #2d6a3e;
        color: #fff !important;
        border-color: #2d6a3e;
      }
      .aulas-accion--editar:hover {
        background: #1a4d2e;
      }
      .aulas-accion--desactivar {
        background: rgba(255, 255, 255, 0.9);
        color: #9f1239;
        border-color: rgba(190, 50, 80, 0.4);
      }
      .aulas-accion--desactivar:hover:not(:disabled) {
        background: #fff1f2;
        border-color: rgba(190, 50, 80, 0.65);
      }
      .aulas-accion--desactivar:disabled {
        opacity: 0.55;
        cursor: not-allowed;
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
