import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CongresoConfig } from '../../../models/congreso-config.model';
import { Aula } from '../../../models/aula.model';
import { CongresoConfigService } from '../../../servicios/congreso-config.service';
import { AulaService } from '../../../servicios/aula.service';
import { mensajeErrorApi } from '../../../utils/api-error.util';
import { aulaTieneCoords, urlMapaAulaCoords } from '../../../utils/aula-mapa.util';
import {
  SedeMapaComponent,
  AulaMapaPunto,
} from '../../../components/aula-mapa/sede-mapa.component';
import { centroDesdeConfig } from '../../../constants/sede-mapa';

@Component({
  selector: 'app-congreso-aulas-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SedeMapaComponent],
  template: `
    <div class="panel-page">
      <div class="panel-hero panel-hero--admin">
        <span class="panel-hero-icon" aria-hidden="true">📍</span>
        <div>
          <h1>Aulas</h1>
          <p>Recursos físicos y ubicación en el mapa de la sede</p>
        </div>
      </div>

      <p class="panel-volver"><a routerLink="/admin/congreso">← Volver a Congreso</a></p>

      <section class="panel-card" id="seccion-aulas">
        <h2>{{ aulaEditId ? 'Editar aula' : 'Nueva aula' }}</h2>
        <p class="muted">
          Al programar actividades se elige un aula; se controlan choques de horario. Opcionalmente
          ubicá cada aula dentro del rango del mapa de la sede.
        </p>
        @if (!centroSede) {
          <p class="notice-box notice-box--amber">
            Primero definí la ubicación del congreso en
            <a routerLink="/admin/congreso/datos">Datos del congreso</a>
            (Editar ubicación en el mapa).
          </p>
        }

        <div class="form-grid form-grid-wide">
          <label>
            Nombre
            <input
              type="text"
              [(ngModel)]="aulaForm.nombre"
              [ngModelOptions]="{ standalone: true }"
              placeholder="Aula Magna"
            />
          </label>
          <label>
            Capacidad
            <input
              type="number"
              min="1"
              [(ngModel)]="aulaForm.capacidad"
              [ngModelOptions]="{ standalone: true }"
              placeholder="80"
            />
          </label>
          <label class="span-full">
            Ubicación (texto)
            <input
              type="text"
              [(ngModel)]="aulaForm.ubicacion"
              [ngModelOptions]="{ standalone: true }"
              placeholder="Edificio central"
            />
          </label>
        </div>

        <h3 style="margin-top: 1.25rem">Ubicación en el mapa</h3>
        @if (centroSede) {
          <p class="muted small">
            @if (aulaSeleccionMapa) {
              Marcada: {{ aulaSeleccionMapa.lat | number: '1.5-5' }},
              {{ aulaSeleccionMapa.lng | number: '1.5-5' }}
            } @else {
              Sin punto en el mapa. Hacé clic dentro del rango de la sede.
            }
          </p>
          <app-sede-mapa
            modo="acotado"
            [centro]="centroSede"
            [aulas]="aulas"
            [excluirAulaId]="aulaEditId"
            [seleccion]="aulaSeleccionMapa"
            [editable]="true"
            [mostrarMiUbicacion]="true"
            ariaLabel="Mapa de aulas en el rango de la sede"
            hint="Mapa acotado al rango de la sede del congreso. Clic o arrastre para ubicar el aula."
            (posicionElegida)="onPosicionAula($event)"
          />
          <div class="inline-form-row" style="margin-top: 0.5rem">
            @if (aulaSeleccionMapa) {
              <button type="button" class="btn-link" (click)="quitarPosicionMapa()">
                Quitar del mapa
              </button>
            }
          </div>
        }

        <div class="inline-form-row" style="margin-top: 0.75rem">
          <button
            type="button"
            class="btn-primary"
            [disabled]="guardandoAula"
            (click)="guardarAula()"
          >
            {{ aulaEditId ? 'Actualizar aula' : 'Crear aula' }}
          </button>
          @if (aulaEditId) {
            <button
              type="button"
              class="btn-link"
              [disabled]="guardandoAula"
              (click)="cancelarEdicionAula()"
            >
              Cancelar edición
            </button>
          }
        </div>
        @if (feedbackAula) {
          <p [class]="feedbackAulaOk ? 'ok' : 'error'" style="margin-top: 0.5rem">
            {{ feedbackAula }}
          </p>
        }
      </section>

      <section class="panel-card aulas-lista-card">
        <h2>Listado de aulas</h2>
        @if (aulas.length) {
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
                  <tr [class.aulas-fila--editando]="aulaEditId === a.id">
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
                        <button type="button" class="btn-link" (click)="editarAula(a)">
                          Editar ubicación en el mapa
                        </button>
                        @if (a.activa) {
                          <button type="button" class="btn-link" (click)="desactivarAula(a)">
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
      .aulas-lista-card {
        margin-top: 1.25rem;
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
      .aulas-fila--editando {
        background: rgba(99, 102, 241, 0.06);
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
  aulaEditId: number | null = null;
  aulaForm = {
    nombre: '',
    capacidad: null as number | null,
    ubicacion: '',
    latitud: null as number | null,
    longitud: null as number | null,
  };
  guardandoAula = false;
  feedbackAula = '';
  feedbackAulaOk = false;
  centroSede: AulaMapaPunto | null = null;
  aulaSeleccionMapa: AulaMapaPunto | null = null;

  private congresoConfigService = inject(CongresoConfigService);
  private aulaService = inject(AulaService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  ngOnInit(): void {
    this.congresoConfigService.obtener().subscribe({
      next: (c: CongresoConfig) => {
        this.centroSede = centroDesdeConfig(c.mapaLatitud, c.mapaLongitud);
      },
    });
    this.cargarAulas();
  }

  cargarAulas(): void {
    this.aulaService.listarAdmin().subscribe({
      next: (items) => {
        this.aulas = items;
        this.aplicarEditarAulaDesdeQuery();
      },
      error: () => (this.aulas = []),
    });
  }

  /** Deep-link: /admin/congreso/aulas?editarAula={id} */
  private aplicarEditarAulaDesdeQuery(): void {
    const raw = this.route.snapshot.queryParamMap.get('editarAula');
    if (!raw) {
      return;
    }
    const id = Number(raw);
    if (!Number.isFinite(id)) {
      return;
    }
    const aula = this.aulas.find((a) => a.id === id);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { editarAula: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
    if (!aula) {
      this.feedbackAulaOk = false;
      this.feedbackAula = `No se encontró el aula #${id} para editar ubicación.`;
      return;
    }
    this.editarAula(aula);
    this.feedbackAulaOk = true;
    this.feedbackAula = aulaTieneCoords(aula)
      ? `Editando ubicación de «${aula.nombre}». Marcá el punto y actualizá.`
      : `«${aula.nombre}» sin punto en el mapa — ubicála abajo y guardá.`;
  }

  editarAula(a: Aula): void {
    this.aulaEditId = a.id ?? null;
    this.aulaForm = {
      nombre: a.nombre,
      capacidad: a.capacidad ?? null,
      ubicacion: a.ubicacion ?? '',
      latitud: a.latitud ?? null,
      longitud: a.longitud ?? null,
    };
    this.syncAulaSeleccionMapa();
    this.feedbackAula = '';
    setTimeout(() => {
      document.getElementById('seccion-aulas')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 40);
  }

  cancelarEdicionAula(): void {
    this.aulaEditId = null;
    this.aulaForm = {
      nombre: '',
      capacidad: null,
      ubicacion: '',
      latitud: null,
      longitud: null,
    };
    this.syncAulaSeleccionMapa();
  }

  onPosicionAula(p: AulaMapaPunto): void {
    this.aulaForm.latitud = p.lat;
    this.aulaForm.longitud = p.lng;
    this.syncAulaSeleccionMapa();
  }

  quitarPosicionMapa(): void {
    this.aulaForm.latitud = null;
    this.aulaForm.longitud = null;
    this.syncAulaSeleccionMapa();
  }

  private syncAulaSeleccionMapa(): void {
    if (this.aulaForm.latitud == null || this.aulaForm.longitud == null) {
      this.aulaSeleccionMapa = null;
      return;
    }
    this.aulaSeleccionMapa = {
      lat: this.aulaForm.latitud,
      lng: this.aulaForm.longitud,
    };
  }

  linkVerMapa(a: Aula): string | null {
    return urlMapaAulaCoords(a);
  }

  guardarAula(): void {
    if (this.guardandoAula) return;
    this.feedbackAula = '';
    if (!this.aulaForm.nombre.trim()) {
      this.feedbackAula = 'Indicá el nombre del aula.';
      this.feedbackAulaOk = false;
      return;
    }
    this.guardandoAula = true;
    const body = {
      nombre: this.aulaForm.nombre.trim(),
      capacidad: this.aulaForm.capacidad || null,
      ubicacion: this.aulaForm.ubicacion.trim() || null,
      activa: true,
      latitud: this.aulaForm.latitud,
      longitud: this.aulaForm.longitud,
    };
    const req = this.aulaEditId
      ? this.aulaService.modificar(this.aulaEditId, body)
      : this.aulaService.crear(body);
    req.subscribe({
      next: () => {
        this.guardandoAula = false;
        this.feedbackAulaOk = true;
        this.feedbackAula = this.aulaEditId ? 'Aula actualizada.' : 'Aula creada.';
        this.cancelarEdicionAula();
        this.cargarAulas();
      },
      error: (err) => {
        this.guardandoAula = false;
        this.feedbackAulaOk = false;
        this.feedbackAula = mensajeErrorApi(err, 'No se pudo guardar el aula.');
      },
    });
  }

  desactivarAula(a: Aula): void {
    if (!a.id || this.guardandoAula) return;
    this.guardandoAula = true;
    this.aulaService.desactivar(a.id).subscribe({
      next: () => {
        this.guardandoAula = false;
        this.feedbackAulaOk = true;
        this.feedbackAula = `Aula "${a.nombre}" desactivada.`;
        this.cargarAulas();
      },
      error: (err) => {
        this.guardandoAula = false;
        this.feedbackAulaOk = false;
        this.feedbackAula = mensajeErrorApi(err, 'No se pudo desactivar el aula.');
      },
    });
  }
}
