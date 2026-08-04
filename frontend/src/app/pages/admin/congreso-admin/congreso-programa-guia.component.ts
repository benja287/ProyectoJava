import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

/** Pasos de la guía admin para armar el programa (orden recomendado). */
export const PASOS_CREAR_PROGRAMA = [
  {
    paso: 1,
    label: 'Datos',
    card: 'datos',
    ruta: '/admin/congreso/datos',
    titulo: 'Datos del congreso',
    detalle: 'Nombre, edición, sede y ubicación en el mapa',
  },
  {
    paso: 2,
    label: 'Franjas',
    card: 'franjas',
    ruta: '/admin/congreso/franjas',
    titulo: 'Franjas horarias',
    detalle: 'Jornada y bloques de horario por día',
  },
  {
    paso: 3,
    label: 'Aulas',
    card: 'aulas',
    ruta: '/admin/congreso/aulas',
    titulo: 'Aulas',
    detalle: 'Salas con capacidad y punto en el mapa',
  },
  {
    paso: 4,
    label: 'Actividades',
    card: 'actividades',
    ruta: '/admin/congreso/actividades',
    titulo: 'Crear actividades',
    detalle: 'Mesas, pósters, taller y conferencia (elegís aula y franja)',
  },
] as const;

/**
 * Barra de guía en cada paso: indicadores + Anterior / Siguiente + ver Programa.
 */
@Component({
  selector: 'app-congreso-programa-guia',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="guia-programa" aria-label="Guía para crear el programa">
      <p class="guia-programa-titulo">
        Guía · Crear programa
        @if (enPrograma) {
          <span class="muted">— resultado del flujo</span>
        } @else {
          <span class="muted">— paso {{ pasoActual }} de {{ pasos.length }}</span>
        }
      </p>
      <nav class="guia-programa-pasos">
        @for (p of pasos; track p.paso) {
          <a
            [routerLink]="p.ruta"
            class="guia-paso"
            [class.guia-paso--activo]="!enPrograma && p.paso === pasoActual"
            [class.guia-paso--hecho]="enPrograma || p.paso < pasoActual"
          >
            <span class="guia-paso-num">{{ p.paso }}</span>
            <span class="guia-paso-label">{{ p.label }}</span>
          </a>
        }
      </nav>
      <div class="guia-programa-acciones">
        @if (enPrograma) {
          <a routerLink="/admin/congreso/actividades" class="btn-secundario">← Actividades</a>
          <a routerLink="/admin/congreso" class="btn-ok">Hub Congreso</a>
        } @else {
          @if (pasoAnterior; as ant) {
            <a [routerLink]="ant.ruta" class="btn-secundario">← {{ ant.label }}</a>
          } @else {
            <a routerLink="/admin/congreso" class="btn-link">← Hub Congreso</a>
          }
          @if (pasoSiguiente; as sig) {
            <a [routerLink]="sig.ruta" class="btn-ok">Siguiente: {{ sig.label }} →</a>
          } @else {
            <a routerLink="/admin/congreso/programa" class="btn-ok">Ver programa →</a>
          }
        }
      </div>
      <p class="muted guia-programa-hint">
        @if (enPrograma) {
          Acá se ve el cronograma de las actividades que cargaste (con aula y franja).
        } @else {
          Cuando creás actividades, elegís aula y franja; se reflejan en
          <a routerLink="/admin/congreso/programa">Programa</a>.
        }
      </p>
    </section>
  `,
  styles: [
    `
      .guia-programa {
        margin: 0 0 0.35rem;
        padding: 0.95rem 1.1rem;
        border: 3px solid rgba(104, 176, 113, 0.86);
        border-radius: 18px;
        background:
          radial-gradient(circle at 100% 0%, rgba(174, 218, 158, 0.32), transparent 42%),
          linear-gradient(145deg, rgba(245, 251, 241, 0.97), rgba(226, 243, 217, 0.95));
        box-shadow:
          0 14px 28px rgba(7, 31, 17, 0.16),
          0 0 0 1px rgba(226, 255, 217, 0.65),
          0 0 22px rgba(90, 178, 103, 0.18);
      }
      .guia-programa-titulo {
        margin: 0 0 0.65rem;
        font-weight: 700;
        color: #102d1c;
      }
      .guia-programa-pasos {
        display: flex;
        flex-wrap: wrap;
        gap: 0.45rem;
        margin-bottom: 0.75rem;
      }
      .guia-paso {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        padding: 0.35rem 0.7rem;
        border-radius: 999px;
        border: 1.5px solid rgba(104, 176, 113, 0.5);
        background: rgba(255, 255, 255, 0.92);
        color: #174e2a !important;
        text-decoration: none;
        font-size: 0.85rem;
        font-weight: 600;
      }
      .guia-paso--activo {
        background: #2d6a3e !important;
        border-color: #2d6a3e;
        color: #fff !important;
        font-weight: 700;
      }
      .guia-paso--hecho:not(.guia-paso--activo) {
        border-color: rgba(72, 156, 90, 0.7);
        background: #e8f6e4 !important;
        color: #174e2a !important;
      }
      .guia-paso-num {
        width: 1.35rem;
        height: 1.35rem;
        border-radius: 50%;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: #2d6a3e;
        color: #fff;
        font-size: 0.75rem;
        font-weight: 700;
      }
      .guia-paso--activo .guia-paso-num {
        background: #fff;
        color: #2d6a3e;
      }
      .guia-paso--hecho:not(.guia-paso--activo) .guia-paso-num {
        background: #3d8b52;
      }
      .guia-programa-acciones {
        display: flex;
        flex-wrap: wrap;
        gap: 0.6rem;
        align-items: center;
        margin-bottom: 0.35rem;
      }
      .guia-programa-acciones .btn-ok,
      .guia-programa-acciones .btn-secundario {
        color: #fff;
        text-decoration: none;
        display: inline-block;
        padding: 0.45rem 0.9rem;
        border-radius: 10px;
      }
      .guia-programa-acciones .btn-secundario {
        background: #4b6354;
      }
      .guia-programa-acciones .btn-link {
        color: #174e2a;
        font-weight: 650;
      }
      .guia-programa-hint {
        margin: 0.35rem 0 0;
        font-size: 0.85rem;
        color: #3f4f44;
      }
    `,
  ],
})
export class CongresoProgramaGuiaComponent {
  readonly pasos = PASOS_CREAR_PROGRAMA;

  /** 1–4 = pasos del flujo; >4 = pantalla Programa (resultado). */
  @Input({ required: true }) pasoActual!: number;

  get enPrograma(): boolean {
    return this.pasoActual > this.pasos.length;
  }

  get pasoAnterior() {
    return this.pasos.find((p) => p.paso === this.pasoActual - 1) ?? null;
  }

  get pasoSiguiente() {
    return this.pasos.find((p) => p.paso === this.pasoActual + 1) ?? null;
  }
}
