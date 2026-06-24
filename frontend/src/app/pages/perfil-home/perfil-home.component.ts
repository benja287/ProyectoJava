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

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    const data = this.route.snapshot.data;
    this.titulo = data['titulo'] ?? 'Perfil';
    this.descripcion = data['descripcion'] ?? '';
    this.menu = data['menu'] ?? [];
  }
}
