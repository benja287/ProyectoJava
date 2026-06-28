import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LoginService } from '../../auth/login.service';
import { ROLE_DESCRIPCIONES, etiquetaRol } from '../../models/role-labels';

@Component({
  selector: 'app-seleccion-rol',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="card seleccion-rol">
      <h1>Seleccioná tu perfil</h1>
      <p>Tenés varios roles. Elegí con cuál querés ingresar.</p>

      @if (error) {
        <p class="error">{{ error }}</p>
      }

      <div class="rol-grid">
        @for (rol of roles; track rol) {
          <button type="button" class="rol-card" (click)="elegir(rol)" [disabled]="procesando">
            <h2>{{ etiqueta(rol) }}</h2>
            <p class="muted">{{ descripcion(rol) }}</p>
            <span class="rol-card-action">Ingresar como {{ etiqueta(rol) }} →</span>
          </button>
        }
      </div>

      <p class="muted">Podés cambiar de perfil después desde el header.</p>
      <p><a routerLink="/">← Volver al inicio</a></p>
    </section>
  `,
})
export class SeleccionRolComponent implements OnInit {
  roles: string[] = [];
  error = '';
  procesando = false;

  constructor(
    private loginService: LoginService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const u = this.loginService.getUser();
    if (!u) {
      this.router.navigate(['/login']);
      return;
    }
    this.roles = u.roles ?? [];
    if (this.roles.length <= 1) {
      this.router.navigateByUrl(this.loginService.homeRoute());
    }
  }

  etiqueta(rol: string): string {
    return etiquetaRol(rol);
  }

  descripcion(rol: string): string {
    return ROLE_DESCRIPCIONES[rol] ?? '';
  }

  elegir(rol: string): void {
    this.error = '';
    this.procesando = true;
    this.loginService.cambiarRolActual(rol).subscribe({
      next: () => {
        this.procesando = false;
        this.router.navigateByUrl(this.loginService.homeRoute());
      },
      error: () => {
        this.procesando = false;
        this.error = 'No se pudo cambiar el perfil.';
      },
    });
  }
}
