import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="card">
      <h1>Congreso de Agroecología — Práctica 8</h1>
      <p>Pantalla inicial con enlaces a registro y homes de cada perfil.</p>

      <h2>Registro</h2>
      <ul class="menu">
        <li><a routerLink="/registro">Nuevo usuario</a></li>
      </ul>

      <h2>Homes por perfil</h2>
      <ul class="menu">
        <li><a routerLink="/admin">Administrador</a></li>
        <li><a routerLink="/organizador">Organizador científico</a></li>
        <li><a routerLink="/evaluador">Evaluador</a></li>
        <li><a routerLink="/autor">Autor</a></li>
        <li><a routerLink="/participante">Participante</a></li>
      </ul>
    </section>
  `,
})
export class InicioComponent {}
