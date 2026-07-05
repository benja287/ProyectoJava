import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Circular } from '../../models/circular.model';
import { CircularService } from '../../servicios/circular.service';
import { mensajeErrorApi } from '../../utils/api-error.util';

@Component({
  selector: 'app-circulares-publicas',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="card">
      <h1>Circulares del congreso</h1>
      <p class="muted">Comunicados oficiales de la organización.</p>

      @if (error) {
        <p class="error">{{ error }}</p>
      }
      @if (cargando) {
        <p>Cargando circulares...</p>
      } @else if (!circulares.length) {
        <p>Todavía no hay circulares publicadas.</p>
      } @else {
        <div class="circular-list">
          @for (c of circulares; track c.id) {
            <article class="panel-card circular-item">
              <h2>{{ c.titulo }}</h2>
              @if (c.fechaPublicacion) {
                <p class="muted small">{{ c.fechaPublicacion }}</p>
              }
              <p class="circular-content">{{ c.contenido }}</p>
            </article>
          }
        </div>
      }

      <p><a routerLink="/">← Volver al inicio</a></p>
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
