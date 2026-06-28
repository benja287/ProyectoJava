import { Component } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LoginService } from './auth/login.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'JYAA — Entrega 5';
  rolError = '';

  constructor(
    public loginService: LoginService,
    private router: Router
  ) {}

  get usuario() {
    return this.loginService.getUser();
  }

  get rolesDisponibles(): string[] {
    return this.usuario?.roles ?? [];
  }

  logout(): void {
    this.loginService.logout();
    this.router.navigate(['/login']);
  }

  irHome(): string {
    return this.loginService.isLogged() ? this.loginService.homeRoute() : '/';
  }

  cambiarRol(event: Event): void {
    const rol = (event.target as HTMLSelectElement).value;
    if (!rol || rol === this.usuario?.rolActual) {
      return;
    }
    this.rolError = '';
    this.loginService.cambiarRolActual(rol).subscribe({
      next: () => {
        this.router.navigateByUrl(this.loginService.homeRoute());
      },
      error: () => {
        this.rolError = 'No se pudo cambiar el rol.';
      },
    });
  }
}
