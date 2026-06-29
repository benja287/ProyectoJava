import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { RegistroService } from '../../servicios/registro.service';
import { mensajeErrorApi } from '../../utils/api-error.util';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="card">
      <h1>Registro de participante</h1>
      <p>POST <code>/api/registro</code> — inscripción al congreso (Entrega 5).</p>

      @if (mensaje) {
        <p class="ok">{{ mensaje }}</p>
      }
      @if (error) {
        <p class="error">{{ error }}</p>
      }

      <form [formGroup]="form" (ngSubmit)="guardar()" class="form-grid">
        <label>
          Apellido
          <input formControlName="apellido" />
        </label>
        <label>
          Nombre
          <input formControlName="nombre" />
        </label>
        <label>
          Email
          <input formControlName="email" type="email" />
        </label>
        <label>
          Contraseña
          <input formControlName="password" type="password" minlength="8" />
        </label>
        <div class="actions">
          <button type="submit" [disabled]="form.invalid || guardando">Registrarme</button>
          <a routerLink="/login">Ya tengo cuenta — ingresar</a>
        </div>
      </form>
    </section>
  `,
})
export class RegistroComponent {
  private fb = inject(FormBuilder);

  form = this.fb.group({
    apellido: ['', Validators.required],
    nombre: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['12345678', [Validators.required, Validators.minLength(8)]],
  });

  mensaje = '';
  error = '';
  guardando = false;

  constructor(
    private registroService: RegistroService,
    private router: Router
  ) {}

  guardar(): void {
    if (this.form.invalid) {
      return;
    }
    this.mensaje = '';
    this.error = '';
    this.guardando = true;
    this.registroService.registrarParticipante(this.form.getRawValue() as never).subscribe({
      next: (creado) => {
        this.mensaje = `Participante registrado (id ${creado.id}). Redirigiendo al login...`;
        this.guardando = false;
        setTimeout(() => this.router.navigate(['/login']), 1500);
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'No se pudo completar el registro. Verificá el email.');
        this.guardando = false;
      },
    });
  }
}
