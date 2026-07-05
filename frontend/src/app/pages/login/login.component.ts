/**
 * Pantalla de login.
 * POST /api/login → LoginService.setUser → navega a panel o /seleccion-rol
 */
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { LoginService } from '../../auth/login.service';
import { AppVersionService } from '../../servicios/app-version.service';
import { mensajeErrorApi, isCuentaDeshabilitada } from '../../utils/api-error.util';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="card">
      <h1>Iniciar sesión</h1>
      <p>
        Ingresá con tu email y contraseña. Si recién te registraste, completá la inscripción al
        congreso. Cuando la organización apruebe tu pago, accedés como <strong>asistente</strong>.
      </p>
      <p class="muted">
        ¿Sos participante nuevo?
        <a routerLink="/registro">Registrate acá</a>.
      </p>

      @if (error) {
        <p class="error">{{ error }}</p>
      }

      <!-- Formulario reactivo: [formGroup] enlaza con this.form -->
      <form [formGroup]="form" (ngSubmit)="ingresar()" class="form-grid">
        <label>
          Email
          <input formControlName="email" type="email" autocomplete="username" />
        </label>
        <label>
          Contraseña
          <input formControlName="password" type="password" autocomplete="current-password" />
        </label>
        <div class="actions">
          <button type="submit" [disabled]="form.invalid || cargando">
            {{ cargando ? 'Ingresando...' : 'Ingresar' }}
          </button>
          <a routerLink="/">Volver al inicio</a>
        </div>
      </form>
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
    private appVersionService: AppVersionService,
    private router: Router,
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
      this.router.navigateByUrl(this.loginService.rutaPanel());
    }
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
        this.appVersionService.checkForUpdate();
        this.router.navigateByUrl(this.loginService.rutaTrasLogin());
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
