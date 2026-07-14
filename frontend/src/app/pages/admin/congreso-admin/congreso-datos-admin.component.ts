import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CongresoConfig } from '../../../models/congreso-config.model';
import { CongresoConfigService } from '../../../servicios/congreso-config.service';
import { mensajeErrorApi } from '../../../utils/api-error.util';
import {
  SedeMapaComponent,
  AulaMapaPunto,
} from '../../../components/aula-mapa/sede-mapa.component';
import { centroDesdeConfig } from '../../../constants/sede-mapa';

@Component({
  selector: 'app-congreso-datos-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SedeMapaComponent],
  template: `
    <div class="panel-page">
      <div class="panel-hero panel-hero--admin">
        <span class="panel-hero-icon" aria-hidden="true">🏛</span>
        <div>
          <h1>Datos del congreso</h1>
          <p>Nombre, edición, sede y ubicación en el mapa</p>
        </div>
      </div>

      <p class="panel-volver"><a routerLink="/admin/congreso">← Volver a Congreso</a></p>

      <section class="panel-card panel-card--indigo">
        <h2>Datos del congreso</h2>
        <p class="muted">Nombre, edición y sede (aparecen en cabecera, inicio y certificados).</p>
        <div class="form-grid form-grid-wide">
          <label class="span-full">
            Nombre
            <input
              type="text"
              [(ngModel)]="datos.nombre"
              [ngModelOptions]="{ standalone: true }"
              placeholder="Congreso Argentino de Agroecología"
            />
          </label>
          <label>
            Edición
            <input
              type="text"
              [(ngModel)]="datos.edicion"
              [ngModelOptions]="{ standalone: true }"
              placeholder="V"
            />
          </label>
          <label>
            Sede
            <input
              type="text"
              [(ngModel)]="datos.sede"
              [ngModelOptions]="{ standalone: true }"
              placeholder="La Plata"
            />
          </label>
        </div>
        <div class="inline-form-row" style="margin-top: 0.75rem">
          <button
            type="button"
            class="btn-primary"
            [disabled]="guardando"
            (click)="guardarDatos()"
          >
            {{ guardando ? 'Guardando...' : 'Guardar datos' }}
          </button>
        </div>
        @if (feedbackDatos) {
          <p [class]="feedbackDatosOk ? 'ok' : 'error'" style="margin-top: 0.5rem">
            {{ feedbackDatos }}
          </p>
        }

        <h3 style="margin-top: 1.25rem">Ubicación en el mapa</h3>
        <p class="muted small">
          Definí el punto de la sede. Al verla se aplica un rango alrededor; las aulas solo pueden
          ubicarse dentro de ese rango.
        </p>
        <div class="inline-form-row" style="margin-top: 0.5rem">
          <button
            type="button"
            class="btn-link"
            [disabled]="!centroSede"
            (click)="abrirMapaCongreso('ver')"
          >
            Ver ubicación del congreso en el mapa
          </button>
          <button type="button" class="btn-link" (click)="abrirMapaCongreso('editar')">
            Editar ubicación en el mapa
          </button>
          @if (mapaCongresoModo) {
            <button type="button" class="btn-link" (click)="cerrarMapaCongreso()">
              Cerrar mapa
            </button>
          }
        </div>
        @if (centroSede) {
          <p class="muted small" style="margin-top: 0.35rem">
            Centro guardado: {{ centroSede.lat | number: '1.5-5' }},
            {{ centroSede.lng | number: '1.5-5' }}
          </p>
        } @else {
          <p class="muted small" style="margin-top: 0.35rem">
            Todavía no hay coordenadas. Usá «Editar ubicación en el mapa» y hacé clic en el mapa.
          </p>
        }

        @if (mapaCongresoModo === 'ver' && centroSede) {
          <app-sede-mapa
            modo="acotado"
            [centro]="centroSede"
            [seleccion]="centroSede"
            [editable]="false"
            [mostrarMiUbicacion]="true"
            ariaLabel="Ubicación del congreso (rango acotado)"
            hint="Vista acotada al rango de la sede. El punto azul es tu ubicación si el navegador la permite."
          />
        }
        @if (mapaCongresoModo === 'editar') {
          <app-sede-mapa
            modo="libre"
            [centro]="centroSede"
            [seleccion]="borradorUbicacion"
            [editable]="true"
            [mostrarMiUbicacion]="true"
            [mostrarBusqueda]="true"
            ariaLabel="Editar ubicación del congreso"
            hint="Escribí una dirección o cruce y elegí del listado, o hacé clic / arrastrá el pin. Luego guardá."
            (posicionElegida)="onPosicionCongreso($event)"
          />
          <div class="inline-form-row" style="margin-top: 0.5rem">
            <button
              type="button"
              class="btn-primary"
              [disabled]="!borradorUbicacion || guardando"
              (click)="guardarUbicacionMapa()"
            >
              {{ guardando ? 'Guardando...' : 'Guardar ubicación' }}
            </button>
          </div>
        }
        @if (feedbackMapa) {
          <p [class]="feedbackMapaOk ? 'ok' : 'error'" style="margin-top: 0.5rem">
            {{ feedbackMapa }}
          </p>
        }
      </section>
    </div>
  `,
})
export class CongresoDatosAdminComponent implements OnInit {
  config?: CongresoConfig;
  datos = { nombre: '', edicion: '', sede: '' };
  guardando = false;
  feedbackDatos = '';
  feedbackDatosOk = false;
  mapaCongresoModo: null | 'ver' | 'editar' = null;
  borradorUbicacion: AulaMapaPunto | null = null;
  feedbackMapa = '';
  feedbackMapaOk = false;
  centroSede: AulaMapaPunto | null = null;

  private congresoConfigService = inject(CongresoConfigService);

  ngOnInit(): void {
    this.congresoConfigService.obtener().subscribe({
      next: (c) => {
        this.config = c;
        this.aplicarDatosDesdeConfig(c);
      },
      error: () => (this.config = undefined),
    });
  }

  guardarDatos(): void {
    if (this.guardando) return;
    this.feedbackDatos = '';
    if (!this.datos.nombre.trim() || !this.datos.edicion.trim()) {
      this.feedbackDatos = 'Nombre y edición son obligatorios.';
      this.feedbackDatosOk = false;
      return;
    }
    this.guardando = true;
    this.congresoConfigService
      .actualizar({
        grupo: 'DATOS',
        nombre: this.datos.nombre.trim(),
        edicion: this.datos.edicion.trim(),
        sede: this.datos.sede.trim(),
      })
      .subscribe({
        next: (c) => {
          this.config = c;
          this.aplicarDatosDesdeConfig(c);
          this.guardando = false;
          this.feedbackDatosOk = true;
          this.feedbackDatos = 'Datos del congreso guardados.';
        },
        error: (err) => {
          this.guardando = false;
          this.feedbackDatosOk = false;
          this.feedbackDatos = mensajeErrorApi(err, 'No se pudieron guardar los datos.');
        },
      });
  }

  abrirMapaCongreso(modo: 'ver' | 'editar'): void {
    this.feedbackMapa = '';
    if (modo === 'ver' && !this.centroSede) {
      this.feedbackMapaOk = false;
      this.feedbackMapa = 'Todavía no hay ubicación guardada. Usá «Editar ubicación en el mapa».';
      return;
    }
    this.mapaCongresoModo = modo;
    this.borradorUbicacion = this.centroSede;
  }

  cerrarMapaCongreso(): void {
    this.mapaCongresoModo = null;
    this.borradorUbicacion = null;
  }

  onPosicionCongreso(p: AulaMapaPunto): void {
    this.borradorUbicacion = p;
  }

  guardarUbicacionMapa(): void {
    if (this.guardando || !this.borradorUbicacion) {
      return;
    }
    this.feedbackMapa = '';
    this.guardando = true;
    this.congresoConfigService
      .actualizar({
        grupo: 'DATOS',
        mapaLatitud: this.borradorUbicacion.lat,
        mapaLongitud: this.borradorUbicacion.lng,
      })
      .subscribe({
        next: (c) => {
          this.config = c;
          this.aplicarDatosDesdeConfig(c);
          this.guardando = false;
          this.feedbackMapaOk = true;
          this.feedbackMapa = 'Ubicación del congreso guardada. El rango del mapa se actualizó.';
          this.mapaCongresoModo = 'ver';
          this.borradorUbicacion = this.centroSede;
        },
        error: (err) => {
          this.guardando = false;
          this.feedbackMapaOk = false;
          this.feedbackMapa = mensajeErrorApi(err, 'No se pudo guardar la ubicación.');
        },
      });
  }

  private aplicarDatosDesdeConfig(c: CongresoConfig): void {
    this.datos = {
      nombre: c.nombre ?? '',
      edicion: c.edicion ?? '',
      sede: c.sede ?? '',
    };
    this.centroSede = centroDesdeConfig(c.mapaLatitud, c.mapaLongitud);
  }
}
