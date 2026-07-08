import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CongresoAnterior } from '../../models/congreso-anterior.model';
import { CongresoAnteriorService } from '../../servicios/congreso-anterior.service';
import { mensajeErrorApi } from '../../utils/api-error.util';

const LISTADO_ANTERIORES_URL =
  'https://congresoagroecologia2023.unrn.edu.ar/page/organizacion/congresos/Congresos-Anteriores';

@Component({
  selector: 'app-historia-congreso',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="historia-page">
      <p class="historia-back">
        <a routerLink="/">← Volver</a>
      </p>

      <header class="historia-hero panel-card">
        <div class="historia-hero-icon" aria-hidden="true">🌱</div>
        <div>
          <h1>Historia del Congreso</h1>
          <p class="muted">
            Una mirada breve y visual a la evolución del Congreso Argentino de Agroecología. En cada
            edición podés acceder al sitio oficial y, cuando corresponde, a las memorias/actas.
          </p>
          <div class="historia-hero-actions">
            <a
              class="btn-primary"
              [href]="listadoUrl"
              target="_blank"
              rel="noopener noreferrer"
            >
              Congresos anteriores (listado)
            </a>
            <a routerLink="/" class="btn-secundario">Volver a Inicio</a>
          </div>
        </div>
      </header>

      <div class="historia-timeline-block">
        <h2>Línea de tiempo</h2>
        <p class="muted">
          Tocá una edición para ver más información en su sitio. Si hay memorias/actas, también las
          podés abrir.
        </p>

        @if (error) {
          <p class="error">{{ error }}</p>
        }
        @if (cargando) {
          <p class="muted">Cargando ediciones...</p>
        } @else if (!ediciones.length) {
          <p class="muted dashed-box">Todavía no hay ediciones registradas.</p>
        } @else {
          <div class="historia-timeline">
            @for (c of ediciones; track c.id; let i = $index) {
              <article class="historia-card" [class.historia-card--right]="i % 2 === 1">
                <div class="historia-card-cover" [attr.data-year]="c.anio"></div>
                <div class="historia-card-body">
                  <div class="historia-card-top">
                    <div>
                      <div class="historia-year">{{ c.anio }}</div>
                      <p class="historia-meta">📅 {{ c.fechaEtiqueta }}</p>
                      <p class="historia-meta">📍 {{ c.ubicacion }}</p>
                    </div>
                    <a
                      class="btn-sitio"
                      [href]="c.urlSitio"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Ver sitio ↗
                    </a>
                  </div>
                  <h3>{{ c.titulo }}</h3>
                  <p>{{ c.destacado }}</p>
                  @if (c.urlMemorias) {
                    <a
                      class="historia-memorias"
                      [href]="c.urlMemorias"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Ver memorias / actas ↗
                    </a>
                  }
                </div>
              </article>
            }
          </div>
        }
      </div>

      <p class="muted small historia-nota">
        Nota: si algún enlace oficial cambia, podemos actualizarlo en esta sección.
      </p>
    </section>
  `,
})
export class HistoriaCongresoComponent implements OnInit {
  readonly listadoUrl = LISTADO_ANTERIORES_URL;
  ediciones: CongresoAnterior[] = [];
  cargando = true;
  error = '';

  constructor(private congresoAnteriorService: CongresoAnteriorService) {}

  ngOnInit(): void {
    this.congresoAnteriorService.listar().subscribe({
      next: (items) => {
        this.ediciones = items;
        this.cargando = false;
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'No se pudo cargar la historia del congreso.');
        this.cargando = false;
      },
    });
  }
}
