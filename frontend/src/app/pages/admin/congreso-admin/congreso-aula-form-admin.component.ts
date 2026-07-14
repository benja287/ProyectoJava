import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CongresoConfig } from '../../../models/congreso-config.model';
import { Aula } from '../../../models/aula.model';
import { CongresoConfigService } from '../../../servicios/congreso-config.service';
import { AulaService } from '../../../servicios/aula.service';
import { mensajeErrorApi } from '../../../utils/api-error.util';
import {
  SedeMapaComponent,
  AulaMapaPunto,
} from '../../../components/aula-mapa/sede-mapa.component';
import { centroDesdeConfig } from '../../../constants/sede-mapa';

@Component({
  selector: 'app-congreso-aula-form-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SedeMapaComponent],
  template: `
    <div class="panel-page">
      <div class="panel-hero panel-hero--admin">
        <span class="panel-hero-icon" aria-hidden="true">📍</span>
        <div>
          <h1>{{ esEdicion ? 'Editar aula' : 'Nueva aula' }}</h1>
          <p>Datos y ubicación en el mapa de la sede</p>
        </div>
      </div>

      <p class="panel-volver"><a routerLink="/admin/congreso/aulas">← Volver a Aulas</a></p>

      @if (cargando) {
        <p class="muted">Cargando aula...</p>
      } @else {
        <section class="panel-card">
          <h2>{{ esEdicion ? 'Editar aula' : 'Crear aula' }}</h2>
          <p class="muted">
            Completá los datos. Opcionalmente marcá el punto dentro del rango del mapa de la sede.
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
                min="0"
                [(ngModel)]="aulaForm.capacidad"
                [ngModelOptions]="{ standalone: true }"
                placeholder="0 = sin cupo"
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
              [excluirAulaId]="aulaId"
              [seleccion]="aulaSeleccionMapa"
              [editable]="true"
              [mostrarMiUbicacion]="true"
              ariaLabel="Mapa de aulas en el rango de la sede"
              hint="Mapa acotado al rango de la sede. Clic o arrastre para ubicar el aula."
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
              [disabled]="guardando"
              (click)="guardar()"
            >
              {{ guardando ? 'Guardando...' : esEdicion ? 'Actualizar aula' : 'Crear aula' }}
            </button>
            <a routerLink="/admin/congreso/aulas" class="btn-link">Cancelar</a>
          </div>
          @if (feedback) {
            <p [class]="feedbackOk ? 'ok' : 'error'" style="margin-top: 0.5rem">
              {{ feedback }}
            </p>
          }
        </section>
      }
    </div>
  `,
})
export class CongresoAulaFormAdminComponent implements OnInit {
  aulas: Aula[] = [];
  aulaId: number | null = null;
  aulaForm = {
    nombre: '',
    capacidad: null as number | null,
    ubicacion: '',
    latitud: null as number | null,
    longitud: null as number | null,
  };
  guardando = false;
  cargando = false;
  feedback = '';
  feedbackOk = false;
  centroSede: AulaMapaPunto | null = null;
  aulaSeleccionMapa: AulaMapaPunto | null = null;

  private congresoConfigService = inject(CongresoConfigService);
  private aulaService = inject(AulaService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  get esEdicion(): boolean {
    return this.aulaId != null;
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam && idParam !== 'nueva') {
      const id = Number(idParam);
      if (Number.isFinite(id)) {
        this.aulaId = id;
        this.cargando = true;
      }
    }

    this.congresoConfigService.obtener().subscribe({
      next: (c: CongresoConfig) => {
        this.centroSede = centroDesdeConfig(c.mapaLatitud, c.mapaLongitud);
      },
    });

    this.aulaService.listarAdmin().subscribe({
      next: (items) => {
        this.aulas = items;
        if (this.aulaId != null) {
          const aula = items.find((a) => a.id === this.aulaId);
          if (!aula) {
            this.cargando = false;
            this.feedbackOk = false;
            this.feedback = `No se encontró el aula #${this.aulaId}.`;
            return;
          }
          this.cargarForm(aula);
        }
        this.cargando = false;
      },
      error: () => {
        this.aulas = [];
        this.cargando = false;
        if (this.aulaId != null) {
          this.feedbackOk = false;
          this.feedback = 'No se pudieron cargar las aulas.';
        }
      },
    });
  }

  private cargarForm(aula: Aula): void {
    this.aulaForm = {
      nombre: aula.nombre,
      capacidad: aula.capacidad ?? null,
      ubicacion: aula.ubicacion ?? '',
      latitud: aula.latitud ?? null,
      longitud: aula.longitud ?? null,
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

  guardar(): void {
    if (this.guardando) return;
    this.feedback = '';
    if (!this.aulaForm.nombre.trim()) {
      this.feedback = 'Indicá el nombre del aula.';
      this.feedbackOk = false;
      return;
    }
    this.guardando = true;
    const body = {
      nombre: this.aulaForm.nombre.trim(),
      capacidad: this.aulaForm.capacidad ?? null,
      ubicacion: this.aulaForm.ubicacion.trim() || null,
      activa: true,
      latitud: this.aulaForm.latitud,
      longitud: this.aulaForm.longitud,
    };
    const req =
      this.aulaId != null
        ? this.aulaService.modificar(this.aulaId, body)
        : this.aulaService.crear(body);
    req.subscribe({
      next: () => {
        this.guardando = false;
        void this.router.navigate(['/admin/congreso/aulas'], {
          state: {
            mensaje: this.aulaId != null ? 'Aula actualizada.' : 'Aula creada.',
          },
        });
      },
      error: (err) => {
        this.guardando = false;
        this.feedbackOk = false;
        this.feedback = mensajeErrorApi(err, 'No se pudo guardar el aula.');
      },
    });
  }
}
