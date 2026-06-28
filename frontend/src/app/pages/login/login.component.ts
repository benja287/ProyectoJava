import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LoginService } from '../../auth/login.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="card">
      <h1>Iniciar sesión</h1>
      <p>
        Ingresá con tu email y contraseña para acceder a tu panel.
        Si tu cuenta tiene varios roles, vas a elegir el perfil después del login.
      </p>
      <p class="muted">
        ¿Sos participante nuevo?
        <a routerLink="/registro">Registrate acá</a>.
      </p>

      @if (error) {
        <p class="error">{{ error }}</p>
      }

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

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  error = '';
  cargando = false;

  constructor(
    private loginService: LoginService,
    private router: Router
  ) {}

  ngOnInit(): void {
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
    this.loginService.login(email!, password!).subscribe({
      next: () => {
        this.cargando = false;
        if (this.loginService.tieneVariosRoles()) {
          this.loginService.limpiarRolActualLocal();
        }
        this.router.navigateByUrl(this.loginService.rutaTrasLogin());
      },
      error: (err) => {
        this.cargando = false;
        if (err.status === 0) {
          this.error =
            'No se pudo conectar a la API. Con npm start usá apiUrl: \'/api\' en environment.ts (proxy).';
        } else {
          this.error =
            err?.error?.error ?? 'Credenciales inválidas o cuenta deshabilitada.';
        }
      },
    });
  }
}
