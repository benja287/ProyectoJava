import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Circular } from '../../models/circular.model';
import { CircularService } from '../../servicios/circular.service';
import { ArchivoLinkComponent } from '../../components/archivo-link/archivo-link.component';
import { mensajeErrorApi } from '../../utils/api-error.util';

@Component({
  selector: 'app-circulares-publicas',
  standalone: true,
  imports: [CommonModule, RouterLink, ArchivoLinkComponent],
  template: `
    <section class="circulares-page">
      <div class="circulares-panel">
        <header class="circulares-panel-header">
          <h1>Circulares del congreso</h1>
          <p class="muted">Comunicados oficiales de la organización.</p>
        </header>

        @if (error) {
          <p class="error">{{ error }}</p>
        }
        @if (cargando) {
          <p class="circulares-status">Cargando circulares...</p>
        } @else if (!circulares.length) {
          <p class="circulares-status">Todavía no hay circulares publicadas.</p>
        } @else {
          <div class="circular-list">
            @for (c of circulares; track c.id) {
              <article class="circular-item">
                <h2>{{ c.titulo }}</h2>
                @if (c.fechaPublicacion) {
                  <p class="muted small">{{ c.fechaPublicacion }}</p>
                }
                @if (c.resumen) {
                  <p class="circular-summary">{{ c.resumen }}</p>
                }
                <p class="circular-content">{{ c.contenido }}</p>
                @if (c.documentoUrl) {
                  <p class="circular-pdf-link">
                    @if (c.documentoNombre) {
                      <span class="muted small">PDF: {{ c.documentoNombre }} — </span>
                    }
                    <app-archivo-link [url]="c.documentoUrl" label="Ver PDF" />
                  </p>
                }
              </article>
            }
          </div>
        }

        <p class="circulares-back"><a routerLink="/">← Volver al inicio</a></p>
      </div>
    </section>
  `,
})
export class CircularesPublicasComponent implements OnInit {
  circulares: Circular[] = [];
  cargando = true;
  error = '';

  constructor(private circularService: CircularService) {}

  ngOnInit(): void {
    this.circularService.listarPublicadas(1, 50).subscribe({
      next: (items) => {
        this.circulares = items;
        this.cargando = false;
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'No se pudieron cargar las circulares.');
        this.cargando = false;
      },
    });
  }
}
