/**
 * Home de cada perfil (admin, organizador, evaluador, autor, participante).
 * Un solo componente reutilizado: el contenido viene del `data` de app.routes.ts
 */
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

export interface MenuItem {
  label: string;
  route: string;
  nota?: string;
}

@Component({
  selector: 'app-perfil-home',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="card">
      <!-- titulo, descripcion y menu se cargan desde route.data en ngOnInit -->
      <h1>{{ titulo }}</h1>
      <p>{{ descripcion }}</p>

      <h2>Menú de funcionalidades</h2>
      <ul class="menu">
        @for (item of menu; track item.route) {
          <li>
            <a [routerLink]="item.route">{{ item.label }}</a>
            @if (item.nota) {
              <span class="muted"> — {{ item.nota }}</span>
            }
          </li>
        }
      </ul>

      <p><a routerLink="/">← Volver al inicio</a></p>
    </section>
  `,
})
export class PerfilHomeComponent implements OnInit {
  titulo = '';
  descripcion = '';
  menu: MenuItem[] = [];

  /** ActivatedRoute: acceso a la ruta activa (params, data, etc.) */
  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    // snapshot.data = foto del `data` definido en app.routes.ts para esta URL
    const data = this.route.snapshot.data;
    this.titulo = data['titulo'] ?? 'Perfil';
    this.descripcion = data['descripcion'] ?? '';
    this.menu = data['menu'] ?? [];
  }
}
