import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Circular } from '../../../models/circular.model';
import { CircularService } from '../../../servicios/circular.service';
import { ArchivoLinkComponent } from '../../../components/archivo-link/archivo-link.component';
import { AppPaginatorComponent } from '../../../components/paginator/app-paginator.component';
import { mensajeErrorApi } from '../../../utils/api-error.util';
import { ListadoPaginadoBase } from '../../../utils/listado-paginado.base';

@Component({
  selector: 'app-circulares-admin',
  standalone: true,
  imports: [CommonModule, RouterLink, ArchivoLinkComponent, AppPaginatorComponent],
  template: `
    <div class="panel-page">
      <div class="panel-hero panel-hero--admin">
        <span class="panel-hero-icon" aria-hidden="true">📄</span>
        <div>
          <h1>Circulares</h1>
          <p>Publicá circulares para que se vean en la sección pública</p>
        </div>
      </div>

      <p class="panel-volver"><a routerLink="/admin">← Volver al panel</a></p>

      @if (error) {
        <p class="error">{{ error }}</p>
      }
      @if (circularesFeedback) {
        <p [class]="circularesFeedback.includes('eliminada') ? 'error' : 'ok'">
          {{ circularesFeedback }}
        </p>
      }

      <section class="panel-card">
        <div class="panel-card-header-row">
          <div>
            <h2>Circulares</h2>
            <p class="muted">Publicá circulares para que se vean en la sección pública.</p>
          </div>
          <a routerLink="/admin/circulares/nueva" class="btn-primary">+ Nueva circular</a>
        </div>

        @if (cargando) {
          <p>Cargando circulares...</p>
        } @else if (!circulares.length) {
          <p class="muted dashed-box">Todavía no cargaste circulares.</p>
        } @else {
          <div class="circular-admin-list">
            @for (c of circulares; track c.id) {
              <article class="circular-admin-item">
                <div>
                  <div class="circular-admin-meta">
                    <span class="badge" [class.badge-ok]="c.publicada" [class.badge-off]="!c.publicada">
                      {{ c.publicada ? 'Publicada' : 'Borrador' }}
                    </span>
                    @if (c.fechaPublicacion) {
                      <span class="muted small">{{ c.fechaPublicacion }}</span>
                    }
                  </div>
                  <h3>{{ c.titulo }}</h3>
                  @if (c.resumen) {
                    <p class="muted circular-snippet">{{ c.resumen }}</p>
                  } @else if (c.contenido) {
                    <p class="muted circular-snippet">{{ c.contenido }}</p>
                  }
                  @if (c.documentoNombre) {
                    <p class="muted small circular-pdf-name">PDF: {{ c.documentoNombre }}</p>
                  }
                  @if (c.documentoUrl) {
                    <p class="circular-pdf-link">
                      <app-archivo-link [url]="c.documentoUrl" label="Ver PDF" />
                    </p>
                  }
                </div>
                <div class="circular-admin-actions">
                  <a [routerLink]="['/admin/circulares/editar', c.id]" class="btn-secundario">Editar</a>
                  <button
                    type="button"
                    class="btn-secundario"
                    [disabled]="accionCircularId === c.id"
                    (click)="togglePublicacion(c)"
                  >
                    {{ c.publicada ? 'Despublicar' : 'Publicar' }}
                  </button>
                  <button
                    type="button"
                    class="btn-link danger"
                    [disabled]="accionCircularId === c.id"
                    (click)="eliminarCircular(c)"
                  >
                    Eliminar
                  </button>
                </div>
              </article>
            }
          </div>

          <app-paginator
            [currentPage]="page"
            [totalPages]="totalPages"
            [total]="total"
            [disabled]="cargando"
            (pageChange)="onPageChange($event)"
          />
        }
      </section>
    </div>
  `,
})
export class CircularesAdminComponent extends ListadoPaginadoBase {
  readonly filterKeys = [] as const;

  override pageSize = 20;
  circulares: Circular[] = [];
  circularesFeedback = '';
  accionCircularId?: number;

  constructor(private circularService: CircularService) {
    super();
  }

  override ngOnInit(): void {
    const st = history.state as { circularesFeedback?: string } | null;
    if (st?.circularesFeedback) {
      this.circularesFeedback = st.circularesFeedback;
      history.replaceState({}, '');
    }
    super.ngOnInit();
  }

  togglePublicacion(c: Circular): void {
    if (!c.id) return;
    this.accionCircularId = c.id;
    this.circularService.alternarPublicacion(c.id).subscribe({
      next: (actualizada) => {
        this.circulares = this.circulares.map((x) => (x.id === actualizada.id ? actualizada : x));
        this.circularesFeedback = actualizada.publicada
          ? 'La circular fue publicada correctamente.'
          : 'La circular fue guardada como borrador.';
        this.accionCircularId = undefined;
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'No se pudo cambiar el estado de la circular.');
        this.accionCircularId = undefined;
      },
    });
  }

  eliminarCircular(c: Circular): void {
    if (!c.id || !confirm(`¿Eliminar la circular "${c.titulo}"?`)) return;
    this.accionCircularId = c.id;
    this.circularService.eliminar(c.id).subscribe({
      next: () => {
        this.circularesFeedback = 'La circular fue eliminada.';
        this.accionCircularId = undefined;
        this.cargarPagina();
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'No se pudo eliminar la circular.');
        this.accionCircularId = undefined;
      },
    });
  }

  protected override cargarPagina(): void {
    this.iniciarCarga();
    this.circularService.listarAdminPagina(this.page, this.pageSize).subscribe({
      next: (pagina) => {
        this.circulares = pagina.items;
        this.aplicarPagina(pagina);
      },
      error: (err) => {
        this.circulares = [];
        this.marcarError(mensajeErrorApi(err, 'No se pudieron cargar las circulares.'));
      },
    });
  }
}
