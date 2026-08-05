import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CatalogoItem } from '../../../models/congreso-config.model';
import { CatalogosCongresoService } from '../../../servicios/catalogos-congreso.service';
import { CongresoConfigService } from '../../../servicios/congreso-config.service';
import { mensajeErrorApi } from '../../../utils/api-error.util';

@Component({
  selector: 'app-catalogos-envio-oc',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="panel-page">
      <div class="panel-hero panel-hero--admin comite-sub-hero">
        <span class="panel-hero-icon" aria-hidden="true">📚</span>
        <div>
          <h1>Catálogos de envío</h1>
          <p>Ejes temáticos, modalidades y tipos de trabajo (editables por el comité)</p>
        </div>
      </div>

      @if (error) {
        <p class="error">{{ error }}</p>
      }
      @if (mensaje) {
        <p class="ok">{{ mensaje }}</p>
      }

      @if (cargando) {
        <p class="muted">Cargando catálogos…</p>
      } @else {
        <section class="panel-card">
          <h2>Ejes temáticos</h2>
          <p class="muted">Los trabajos y evaluadores usan el código/texto del eje. Podés agregar o desactivar.</p>
          <div class="catalogo-lista">
            @for (item of ejes; track item.codigo; let i = $index) {
              <div class="catalogo-fila">
                <input [(ngModel)]="item.etiqueta" [name]="'eje-et-' + i" (change)="syncEjeCodigo(item)" />
                <label class="checkbox-inline">
                  <input type="checkbox" [(ngModel)]="item.activo" [name]="'eje-ac-' + i" />
                  Activo
                </label>
                <button type="button" class="btn-link" (click)="quitar(ejes, i)" [disabled]="item.sistema && ejes.length <= 1">
                  Quitar
                </button>
              </div>
            }
          </div>
          <button type="button" class="btn-secundario" (click)="agregarEje()">+ Agregar eje</button>
        </section>

        <section class="panel-card" style="margin-top: 1rem">
          <h2>Modalidades de presentación</h2>
          <p class="muted">
            Código estable (ej. ORAL). El grupo agenda define dónde se programa el trabajo aprobado:
            MESA (mesas temáticas) o POSTER (sesiones de pósters). Con NINGUNO el trabajo no se
            puede incluir en el programa.
          </p>
          <div class="catalogo-lista">
            @for (item of modalidades; track item.codigo; let i = $index) {
              <div class="catalogo-fila catalogo-fila--mod">
                <input
                  [(ngModel)]="item.codigo"
                  [name]="'mod-cod-' + i"
                  [readonly]="!!item.sistema"
                  placeholder="CODIGO"
                />
                <input [(ngModel)]="item.etiqueta" [name]="'mod-et-' + i" placeholder="Etiqueta" />
                <select [(ngModel)]="item.grupoAgenda" [name]="'mod-ga-' + i">
                  <option value="MESA">MESA</option>
                  <option value="POSTER">POSTER</option>
                  <option value="NINGUNO">NINGUNO</option>
                </select>
                <label class="checkbox-inline">
                  <input type="checkbox" [(ngModel)]="item.activo" [name]="'mod-ac-' + i" />
                  Activo
                </label>
                <button type="button" class="btn-link" (click)="quitar(modalidades, i)" [disabled]="!!item.sistema">
                  Quitar
                </button>
              </div>
            }
          </div>
          <button type="button" class="btn-secundario" (click)="agregarModalidad()">+ Agregar modalidad</button>
        </section>

        <section class="panel-card" style="margin-top: 1rem">
          <h2>Tipos de envío</h2>
          <p class="muted">
            PROPUESTA_TALLER es de sistema (taller). Los demás aparecen en el formulario de trabajos.
          </p>
          <div class="catalogo-lista">
            @for (item of tipos; track item.codigo; let i = $index) {
              <div class="catalogo-fila catalogo-fila--mod">
                <input
                  [(ngModel)]="item.codigo"
                  [name]="'tip-cod-' + i"
                  [readonly]="!!item.sistema"
                  placeholder="CODIGO"
                />
                <input [(ngModel)]="item.etiqueta" [name]="'tip-et-' + i" placeholder="Etiqueta" />
                <label class="checkbox-inline">
                  <input type="checkbox" [(ngModel)]="item.activo" [name]="'tip-ac-' + i" />
                  Activo
                </label>
                <button
                  type="button"
                  class="btn-link"
                  (click)="quitar(tipos, i)"
                  [disabled]="!!item.sistema"
                >
                  Quitar
                </button>
              </div>
            }
          </div>
          <button type="button" class="btn-secundario" (click)="agregarTipo()">+ Agregar tipo</button>
        </section>

        <div class="actions" style="margin-top: 1rem">
          <button type="button" class="btn-primary" (click)="guardar()" [disabled]="procesando">
            {{ procesando ? 'Guardando…' : 'Guardar catálogos' }}
          </button>
        </div>
      }

      <p class="panel-volver">
        <a routerLink="/organizador">← Volver al panel del comité</a>
      </p>
    </div>
  `,
  styles: [
    `
      .catalogo-lista {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        margin: 0.75rem 0;
      }
      .catalogo-fila {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        align-items: center;
      }
      .catalogo-fila input[type='text'],
      .catalogo-fila input:not([type]),
      .catalogo-fila select {
        min-width: 10rem;
        flex: 1;
      }
      .catalogo-fila--mod input:first-child {
        max-width: 14rem;
        flex: 0 1 14rem;
        font-family: ui-monospace, monospace;
        text-transform: uppercase;
      }
    `,
  ],
})
export class CatalogosEnvioOcComponent implements OnInit {
  private catalogos = inject(CatalogosCongresoService);
  private configService = inject(CongresoConfigService);

  ejes: CatalogoItem[] = [];
  modalidades: CatalogoItem[] = [];
  tipos: CatalogoItem[] = [];
  cargando = true;
  procesando = false;
  error = '';
  mensaje = '';

  ngOnInit(): void {
    this.catalogos.obtener(true).subscribe({
      next: (cfg) => {
        this.ejes = structuredClone(cfg.ejesTematicos ?? []);
        this.modalidades = structuredClone(cfg.modalidadesPresentacion ?? []);
        this.tipos = structuredClone(cfg.tiposEnvio ?? []);
        this.cargando = false;
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'No se pudieron cargar los catálogos.');
        this.cargando = false;
      },
    });
  }

  syncEjeCodigo(item: CatalogoItem): void {
    if (!item.sistema) {
      item.codigo = item.etiqueta.trim();
    }
  }

  agregarEje(): void {
    this.ejes.push({
      codigo: '',
      etiqueta: '',
      activo: true,
      orden: this.ejes.length + 1,
      sistema: false,
    });
  }

  agregarModalidad(): void {
    this.modalidades.push({
      codigo: '',
      etiqueta: '',
      activo: true,
      orden: this.modalidades.length + 1,
      sistema: false,
      grupoAgenda: 'MESA',
    });
  }

  agregarTipo(): void {
    this.tipos.push({
      codigo: '',
      etiqueta: '',
      activo: true,
      orden: this.tipos.length + 1,
      sistema: false,
    });
  }

  quitar(lista: CatalogoItem[], index: number): void {
    const item = lista[index];
    if (item?.sistema) {
      return;
    }
    lista.splice(index, 1);
  }

  guardar(): void {
    this.procesando = true;
    this.error = '';
    this.mensaje = '';
    const ejes = this.ejes
      .map((e, i) => ({
        ...e,
        etiqueta: e.etiqueta.trim(),
        codigo: (e.codigo || e.etiqueta).trim(),
        orden: i + 1,
      }))
      .filter((e) => e.etiqueta);
    const modalidades = this.modalidades
      .map((m, i) => ({
        ...m,
        codigo: m.codigo.trim().toUpperCase().replace(/\s+/g, '_'),
        etiqueta: m.etiqueta.trim(),
        orden: i + 1,
        grupoAgenda: m.grupoAgenda || 'NINGUNO',
      }))
      .filter((m) => m.codigo && m.etiqueta);
    const tipos = this.tipos
      .map((t, i) => ({
        ...t,
        codigo: t.codigo.trim().toUpperCase().replace(/\s+/g, '_'),
        etiqueta: t.etiqueta.trim(),
        orden: i + 1,
      }))
      .filter((t) => t.codigo && t.etiqueta);

    this.configService
      .actualizar({
        grupo: 'CATALOGOS',
        ejesTematicos: ejes,
        modalidadesPresentacion: modalidades,
        tiposEnvio: tipos,
      })
      .subscribe({
        next: (cfg) => {
          this.ejes = structuredClone(cfg.ejesTematicos ?? ejes);
          this.modalidades = structuredClone(cfg.modalidadesPresentacion ?? modalidades);
          this.tipos = structuredClone(cfg.tiposEnvio ?? tipos);
          this.catalogos.invalidate();
          this.mensaje = 'Catálogos guardados. Los formularios de envío ya usan estos valores.';
          this.procesando = false;
        },
        error: (err) => {
          this.error = mensajeErrorApi(err, 'No se pudieron guardar los catálogos.');
          this.procesando = false;
        },
      });
  }
}
