import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

export interface PanelAccion {
  label: string;
  route: string;
  descripcion: string;
  icono: string;
  color: string;
}

@Component({
  selector: 'app-panel-rol',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="panel-page">
      <div class="panel-hero" [class]="'panel-hero--' + colorTema">
        <span class="panel-hero-icon" aria-hidden="true">{{ iconoTema }}</span>
        <div>
          <h1>{{ titulo }}</h1>
          <p>{{ descripcion }}</p>
        </div>
      </div>

      <div class="panel-asistente-grid">
        @for (accion of acciones; track accion.route) {
          <a [routerLink]="accion.route" class="accion-card">
            <span class="accion-icono" [class]="'accion-icono--' + accion.color" aria-hidden="true">
              {{ accion.icono }}
            </span>
            <div>
              <h3>{{ accion.label }}</h3>
              <p>{{ accion.descripcion }}</p>
            </div>
          </a>
        }
      </div>

      <p class="panel-volver"><a routerLink="/">← Volver al inicio</a></p>
    </div>
  `,
})
export class PanelRolComponent implements OnInit {
  titulo = '';
  descripcion = '';
  acciones: PanelAccion[] = [];
  colorTema = 'verde';
  iconoTema = '📋';

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    const data = this.route.snapshot.data;
    this.titulo = data['titulo'] ?? 'Panel';
    this.descripcion = data['descripcion'] ?? '';
    this.acciones = data['acciones'] ?? [];
    this.colorTema = data['colorTema'] ?? 'verde';
    this.iconoTema = data['iconoTema'] ?? '📋';
  }
}
