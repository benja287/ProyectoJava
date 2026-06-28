import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LoginService } from '../../auth/login.service';
import { etiquetaRol } from '../../models/role-labels';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="card">
      <h1>Congreso de Agroecología — Entrega 5</h1>

      @if (logueado) {
        <p>
          Hola, {{ usuario?.nombre }} {{ usuario?.apellido }}.
          @if (usuario?.rolActual) {
            Estás en el perfil de <strong>{{ etiqueta(usuario!.rolActual!) }}</strong>.
          } @else if (loginService.tieneVariosRoles()) {
            Elegí un perfil para continuar.
          }
        </p>
        <ul class="menu">
          <li><a [routerLink]="loginService.rutaPanel()">Ir a mi panel</a></li>
          @if (loginService.tieneVariosRoles()) {
            <li><a routerLink="/seleccion-rol">Cambiar perfil</a></li>
          }
        </ul>
      } @else {
        <p>
          Bienvenido al sistema del congreso. Para acceder a tu panel (administrador,
          organizador, evaluador, autor o participante) tenés que iniciar sesión.
        </p>
        <h2>Acceso</h2>
        <ul class="menu">
          <li><a routerLink="/login">Iniciar sesión</a></li>
          <li><a routerLink="/registro">Registrarme como participante</a></li>
        </ul>
      }
    </section>
  `,
})
export class InicioComponent {
  constructor(public loginService: LoginService) {}

  get logueado(): boolean {
    return this.loginService.isLogged();
  }

  get usuario() {
    return this.loginService.getUser();
  }

  etiqueta(rol: string): string {
    return etiquetaRol(rol);
  }
}
