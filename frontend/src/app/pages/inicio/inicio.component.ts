import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="card">
      <h1>Congreso de Agroecología — Entrega 5</h1>
      <p>Angular integrado al REST de Entrega 4. Iniciá sesión para acceder a tu perfil.</p>

      <h2>Acceso</h2>
      <ul class="menu">
        <li><a routerLink="/login">Iniciar sesión</a></li>
        <li><a routerLink="/registro">Registrarme como participante</a></li>
      </ul>

      <h2>Perfiles (requieren login)</h2>
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
