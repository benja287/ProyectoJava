/**
 * Pantalla para elegir perfil cuando el usuario tiene varios roles.
 * Ruta: /seleccion-rol (protegida por authGuard + seleccionRolGuard)
 */
import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LoginService } from '../../auth/login.service';
import { navegarConRecargaCompleta } from '../../utils/hard-navigation.util';
import { mensajeErrorApi } from '../../utils/api-error.util';
import { ROLE_DESCRIPCIONES, etiquetaRol } from '../../models/role-labels';

@Component({
  selector: 'app-seleccion-rol',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="seleccion-rol-page">
      <div class="seleccion-rol-panel">
        <header class="seleccion-rol-header">
          <h1>Seleccioná tu perfil</h1>
          <p class="muted">Tenés varios roles. Elegí con cuál querés ingresar.</p>
        </header>

        @if (error) {
          <p class="error">{{ error }}</p>
        }

        <div class="rol-grid">
          @for (rol of roles; track rol) {
            <button
              type="button"
              class="rol-card"
              [attr.data-rol]="rol"
              (click)="elegir(rol)"
              [disabled]="procesando"
            >
              <div class="rol-card-body">
                <h2>{{ etiqueta(rol) }}</h2>
                <p class="muted">{{ descripcion(rol) }}</p>
                <span class="rol-card-action">Ingresar como {{ etiqueta(rol) }} →</span>
              </div>
            </button>
          }
        </div>

        <p class="seleccion-rol-hint muted">Podés cambiar de perfil después desde el header.</p>
        <p class="seleccion-rol-back"><a routerLink="/">← Volver al inicio</a></p>
      </div>
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
    if (!this.loginService.isLogged()) {
      this.router.navigate(['/login']);
      return;
    }
    this.loginService.refreshSession(true).subscribe({
      next: (u) => this.aplicarRoles(u),
      error: () => {
        const u = this.loginService.getUser();
        if (!u) {
          this.router.navigate(['/login']);
          return;
        }
        this.aplicarRoles(u);
      },
    });
  }

  private aplicarRoles(u: { roles?: string[] }): void {
    this.roles = u.roles ?? [];
    if (this.roles.length <= 1) {
      navegarConRecargaCompleta(this.loginService.homeRoute());
    }
  }

  etiqueta(rol: string): string {
    return etiquetaRol(rol);
  }

  descripcion(rol: string): string {
    return ROLE_DESCRIPCIONES[rol] ?? '';
  }

  /** PUT /api/usuarios/{id}/roles con el rol elegido → navega al panel */
  elegir(rol: string): void {
    this.error = '';
    this.procesando = true;
    this.loginService.cambiarRolActual(rol).subscribe({
      next: () => {
        this.procesando = false;
        navegarConRecargaCompleta(this.loginService.homeRoute());
      },
      error: (err) => {
        this.procesando = false;
        this.error = mensajeErrorApi(err, 'No se pudo cambiar el perfil.');
      },
    });
  }
}
