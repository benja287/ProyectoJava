/**
 * Pantalla de login.
 * POST /api/login → LoginService.setUser → navega a panel o /seleccion-rol
 */
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { LoginService } from '../../auth/login.service';
import { navegarConRecargaCompleta } from '../../utils/hard-navigation.util';
import { mensajeErrorApi, isCuentaDeshabilitada } from '../../utils/api-error.util';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="auth-page login-page">
      <div class="auth-card login-card">
        <div class="auth-header">
          <span class="auth-icon login-icon" aria-hidden="true">↪</span>
          <span class="login-eyebrow">Bienvenido nuevamente</span>
          <h1>Iniciar sesión</h1>
          <p class="muted">
            Ingresá con tu email y contraseña. Si recién te registraste, completá la inscripción al
            congreso. Cuando la organización apruebe tu pago, accedés como
            <strong>asistente</strong>.
          </p>
          <p class="muted">
            ¿Sos participante nuevo?
            <a routerLink="/registro">Registrate acá</a>.
          </p>
        </div>

        @if (error) {
          <p class="error">{{ error }}</p>
        }

        <form [formGroup]="form" (ngSubmit)="ingresar()" class="auth-form login-form">
          <label>
            Email
            <input formControlName="email" type="email" autocomplete="username" />
          </label>
          <label>
            Contraseña
            <input formControlName="password" type="password" autocomplete="current-password" />
          </label>
          <button
            type="submit"
            class="btn-primary-full login-submit"
            [disabled]="form.invalid || cargando"
          >
            {{ cargando ? 'Ingresando...' : 'Ingresar' }}
          </button>
          <p class="muted" style="text-align: center; margin: 0.5rem 0 0">
            <a routerLink="/">← Volver al inicio</a>
          </p>
        </form>
      </div>
    </section>
  `,
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);

  /** Definición del formulario con validaciones */
  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  error = '';
  cargando = false;

  constructor(
    private loginService: LoginService,
    private route: ActivatedRoute
  ) {}

  /** Si ya hay sesión, no mostrar login → ir al panel */
  ngOnInit(): void {
    if (this.route.snapshot.queryParamMap.get('accountDisabled')) {
      this.loginService.logout();
      this.error = 'Tu cuenta fue deshabilitada. Contactá al administrador.';
      return;
    }
    if (this.route.snapshot.queryParamMap.get('sessionExpired')) {
      this.loginService.logout();
      this.error = 'Tu sesión expiró. Volvé a iniciar sesión.';
      return;
    }
    if (this.loginService.isLogged()) {
      navegarConRecargaCompleta(this.loginService.rutaPanel());
    }
  }

  private irTrasLogin(): void {
    navegarConRecargaCompleta(this.loginService.rutaTrasLogin());
  }

  ingresar(): void {
    if (this.form.invalid) {
      return;
    }
    this.error = '';
    this.cargando = true;
    const { email, password } = this.form.getRawValue();
    // Limpia JWT previo para que un intento de login no compita con sesión antigua
    this.loginService.logout();
    this.loginService.login(email!, password!).subscribe({
      next: () => {
        this.cargando = false;
        // Multi-rol: forzar elección de perfil (rolActual = null en sessionStorage)
        if (this.loginService.tieneVariosRoles()) {
          this.loginService.limpiarRolActualLocal();
        }
        this.irTrasLogin();
      },
      error: (err) => {
        this.cargando = false;
        if (isCuentaDeshabilitada(err)) {
          this.error = 'Cuenta deshabilitada. Contactá al administrador.';
          return;
        }
        this.error = mensajeErrorApi(err, 'Credenciales inválidas.');
      },
    });
  }
}
