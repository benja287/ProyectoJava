import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Aula } from '../../models/aula.model';
import { aulaTieneCoords, rutaEditarAulaAdmin, urlMapaAulaCoords } from '../../utils/aula-mapa.util';

/**
 * Pin de ubicación ligado a un aula/actividad.
 * - Con coords: abre OSM.
 * - Sin coords + admin: avisa e invita a editar esa aula en /admin/congreso.
 * - Sin coords + público: solo texto (sin link engañoso).
 */
@Component({
  selector: 'app-aula-ubicacion-link',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    @if (etiqueta) {
      <span class="aula-ubicacion">
        @if (urlOsm) {
          <a
            class="aula-ubicacion-pin"
            [href]="urlOsm"
            target="_blank"
            rel="noopener noreferrer"
            [attr.title]="'Ver ' + etiqueta + ' en el mapa'"
            [attr.aria-label]="'Ver ubicación de ' + etiqueta + ' en el mapa'"
          >📍</a>
          <span class="aula-ubicacion-nombre">{{ etiqueta }}</span>
        } @else if (modoAdmin && aulaId != null) {
          <a
            class="aula-ubicacion-pin aula-ubicacion-pin--faltante"
            [routerLink]="rutaAdmin.path"
            [queryParams]="rutaAdmin.queryParams"
            (click)="avisarSinMapa($event)"
            title="Sin punto en el mapa — cargar ubicación del aula"
            [attr.aria-label]="'Cargar ubicación del aula ' + etiqueta"
          >📍</a>
          <span class="aula-ubicacion-nombre">{{ etiqueta }}</span>
        } @else {
          <span class="aula-ubicacion-pin aula-ubicacion-pin--inactivo" title="Sin ubicación en el mapa"
            >📍</span
          >
          <span class="aula-ubicacion-nombre">{{ etiqueta }}</span>
        }
      </span>
    }
  `,
  styles: [
    `
      .aula-ubicacion {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        flex-wrap: wrap;
      }
      .aula-ubicacion-pin {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        text-decoration: none;
        font-size: 1.05em;
        line-height: 1;
        filter: saturate(1.15);
        cursor: pointer;
      }
      .aula-ubicacion-pin:hover {
        transform: scale(1.12);
      }
      .aula-ubicacion-pin--faltante {
        opacity: 0.85;
        outline: 1px dashed #c45c4a;
        outline-offset: 2px;
        border-radius: 50%;
      }
      .aula-ubicacion-pin--inactivo {
        opacity: 0.55;
        cursor: default;
      }
      .aula-ubicacion-nombre {
        color: inherit;
      }
    `,
  ],
})
export class AulaUbicacionLinkComponent {
  /** Aula resuelta (preferido). */
  @Input() aula: Aula | null = null;
  /** Fallback si aún no se resolvió el aula. */
  @Input() aulaId: number | null = null;
  /** Nombre a mostrar (sala / nombre de aula). */
  @Input() sala = '';
  /** admin: ofrece deep-link a editar; public: solo texto si no hay mapa. */
  @Input() modoAdmin = false;

  get etiqueta(): string {
    return (this.aula?.nombre || this.sala || '').trim();
  }

  get urlOsm(): string | null {
    return urlMapaAulaCoords(this.aula);
  }

  get rutaAdmin(): { path: string; queryParams: { editarAula: number } } {
    return rutaEditarAulaAdmin(this.aulaId!);
  }

  get tieneCoords(): boolean {
    return aulaTieneCoords(this.aula);
  }

  avisarSinMapa(ev: MouseEvent): void {
    const ok = window.confirm(
      `El aula «${this.etiqueta}» no tiene ubicación en el mapa.\n\n` +
        'Vas a ir a Congreso → Aulas para cargarla. ¿Continuar?'
    );
    if (!ok) {
      ev.preventDefault();
      ev.stopPropagation();
    }
  }
}
