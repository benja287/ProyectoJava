/**
 * Pantalla para elegir perfil cuando el usuario tiene varios roles.
 * Ruta: /seleccion-rol (protegida por authGuard + seleccionRolGuard)
 */
import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LoginService } from '../../auth/login.service';
import { mensajeErrorApi } from '../../utils/api-error.util';
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

      <!-- Una tarjeta por cada rol del usuario -->
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
    if (!this.loginService.isLogged()) {
      this.router.navigate(['/login']);
      return;
    }
    const u = this.loginService.getUser();
    if (!u) {
      this.router.navigate(['/login']);
      return;
    }
    this.roles = u.roles ?? [];
    // Si solo tiene un rol, no tiene sentido esta pantalla
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

  /** PUT /api/usuarios/{id}/roles con el rol elegido → navega al panel */
  elegir(rol: string): void {
    this.error = '';
    this.procesando = true;
    this.loginService.cambiarRolActual(rol).subscribe({
      next: () => {
        this.procesando = false;
        this.router.navigateByUrl(this.loginService.homeRoute());
      },
      error: (err) => {
        this.procesando = false;
        this.error = mensajeErrorApi(err, 'No se pudo cambiar el perfil.');
      },
    });
  }
}
