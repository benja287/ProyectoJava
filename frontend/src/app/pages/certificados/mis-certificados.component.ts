import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { LoginService } from '../../auth/login.service';
import { CongresoConfig, anioCongreso } from '../../models/congreso-config.model';
import { CongresoConfigService } from '../../servicios/congreso-config.service';
import {
  CertificadoItemApi,
  CertificadosService,
  MisCertificadosApi,
} from '../../servicios/certificados.service';

/**
 * Hub unificado de certificados. Deep link de notificaciones: /mis-certificados.
 * Incluye asistencia, evaluador, presentación (trabajo en actividad) y participación por agenda.
 */
@Component({
  selector: 'app-mis-certificados',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="panel-page mis-certificados-page">
      <div class="panel-hero panel-hero--verde">
        <span class="panel-hero-icon" aria-hidden="true">📜</span>
        <div>
          <h1>Mis certificados</h1>
          <p>Descargá o imprimí los certificados que te corresponden</p>
        </div>
      </div>

      <p class="panel-volver">
        <a routerLink="/">← Inicio</a>
        @if (loginService.hasRole('ASISTENTE')) {
          · <a routerLink="/asistente">Panel asistente</a>
        }
        @if (loginService.hasRole('AUTOR')) {
          · <a routerLink="/autor">Panel autor</a>
        }
        @if (loginService.hasRole('EVALUADOR')) {
          · <a routerLink="/evaluador">Panel evaluador</a>
        }
      </p>

      @if (cargando) {
        <p class="muted">Cargando…</p>
      } @else if (errorCarga) {
        <div class="notice-box notice-box--amber">{{ errorCarga }}</div>
      } @else if (!disponiblesDesde) {
        <div class="notice-box">
          La organización todavía no habilitó la descarga de certificados. Cuando el congreso
          finalice (o el admin lo habilite), vas a poder imprimirlos desde acá.
        </div>
      } @else if (!habilitados) {
        <div class="notice-box notice-box--amber">
          Los certificados estarán disponibles a partir del
          <strong>{{ formatFechaEs(disponiblesDesde) }}</strong>.
        </div>
      } @else if (!items.length) {
        <div class="notice-box">
          No hay certificados asociados a tu cuenta. Si creés que corresponde uno, contactá a la
          organización.
        </div>
      } @else {
        <p class="muted">
          Gracias por ser parte del {{ tituloCongreso }}. Elegí un certificado o imprimí todos.
        </p>

        <div class="mis-certificados-acciones no-print">
          <button type="button" class="btn-primary" (click)="imprimirTodos()">
            Imprimir / guardar todos
          </button>
        </div>

        <div class="mis-certificados-lista">
          @for (c of items; track c.tipo) {
            <article class="panel-card certificado-card" [id]="printId(c)">
              <div class="certificado-preview">
                <h2>{{ c.titulo }}</h2>
                <p class="certificado-nombre">
                  <strong>{{ usuario?.nombre }} {{ usuario?.apellido }}</strong>
                </p>
                <p>{{ c.detalle }}</p>
                @if (c.lineas?.length) {
                  <ul class="certificado-lineas">
                    @for (linea of c.lineas; track linea) {
                      <li>{{ linea }}</li>
                    }
                  </ul>
                }
                <p class="muted small">{{ sedeAnioCert }}</p>
              </div>
              <div class="no-print" style="margin-top: 0.75rem">
                <button type="button" class="btn-secundario" (click)="imprimirUno(printId(c))">
                  Imprimir / guardar PDF
                </button>
              </div>
            </article>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      .mis-certificados-lista {
        display: grid;
        gap: 1rem;
        margin-top: 1rem;
      }
      .certificado-preview {
        text-align: center;
        padding: 1.25rem 1rem;
        border: 1px dashed #94a3b8;
        border-radius: 12px;
        background: #f8fafc;
      }
      .certificado-nombre {
        font-size: 1.15rem;
        margin: 0.75rem 0;
      }
      .certificado-lineas {
        text-align: left;
        display: inline-block;
        margin: 0.75rem auto 0;
        padding-left: 1.25rem;
        max-width: 36rem;
      }
      .certificado-lineas li {
        margin: 0.25rem 0;
      }
      .mis-certificados-acciones {
        margin: 0.75rem 0 0;
      }
      @media print {
        .no-print,
        .panel-volver,
        .panel-hero {
          display: none !important;
        }
        .certificado-card {
          break-after: page;
          box-shadow: none;
          border: none;
        }
        .certificado-preview {
          border: 2px solid #334155;
          background: #fff;
          padding: 2rem;
        }
      }
    `,
  ],
})
export class MisCertificadosComponent implements OnInit {
  readonly loginService = inject(LoginService);
  private congresoConfigService = inject(CongresoConfigService);
  private certificadosService = inject(CertificadosService);

  config?: CongresoConfig;
  items: CertificadoItemApi[] = [];
  disponiblesDesde: string | null = null;
  habilitados = false;
  cargando = true;
  errorCarga = '';

  get usuario() {
    return this.loginService.getUser();
  }

  get tituloCongreso(): string {
    const ed = this.config?.edicion?.trim() || 'V';
    const nom = this.config?.nombre?.trim() || 'Congreso Argentino de Agroecología';
    return `${ed} ${nom}`;
  }

  get sedeAnioCert(): string {
    const sede = this.config?.sede?.trim() || 'La Plata';
    return `${sede}, Argentina · ${anioCongreso(this.config)}`;
  }

  ngOnInit(): void {
    forkJoin({
      config: this.congresoConfigService.obtener().pipe(catchError(() => of(undefined))),
      mios: this.certificadosService.mios().pipe(
        catchError(() => {
          this.errorCarga = 'No se pudieron cargar tus certificados. Probá de nuevo más tarde.';
          return of(null as MisCertificadosApi | null);
        })
      ),
    }).subscribe({
      next: ({ config, mios }) => {
        this.config = config;
        if (mios) {
          this.disponiblesDesde = mios.disponiblesDesde;
          this.habilitados = mios.habilitados;
          this.items = mios.items ?? [];
        }
        this.cargando = false;
      },
      error: () => {
        this.errorCarga = 'No se pudieron cargar tus certificados.';
        this.cargando = false;
      },
    });
  }

  printId(c: CertificadoItemApi): string {
    return `cert-${c.tipo.toLowerCase()}`;
  }

  formatFechaEs(fecha: string): string {
    const [y, m, d] = fecha.split('-');
    return `${d}/${m}/${y}`;
  }

  imprimirUno(printId: string): void {
    document.querySelectorAll('.certificado-card').forEach((el) => {
      (el as HTMLElement).style.display = el.id === printId ? '' : 'none';
    });
    window.print();
    document.querySelectorAll('.certificado-card').forEach((el) => {
      (el as HTMLElement).style.display = '';
    });
  }

  imprimirTodos(): void {
    window.print();
  }
}
