import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { UsuarioService } from '../../../servicios/usuario.service';

@Component({
  selector: 'app-usuario-alta',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="card">
      <h1>Alta de usuario (admin)</h1>
      <p>POST <code>/api/usuarios</code> — distinto del registro de participante.</p>

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
          <button type="submit" [disabled]="form.invalid || guardando">Guardar</button>
          <a routerLink="/admin/usuarios">Cancelar</a>
        </div>
      </form>
    </section>
  `,
})
export class UsuarioAltaComponent {
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
    private usuarioService: UsuarioService,
    private router: Router
  ) {}

  guardar(): void {
    if (this.form.invalid) {
      return;
    }
    this.mensaje = '';
    this.error = '';
    this.guardando = true;
    this.usuarioService.alta(this.form.getRawValue() as never).subscribe({
      next: (creado) => {
        this.mensaje = `Usuario creado (id ${creado.id}).`;
        this.guardando = false;
        setTimeout(() => this.router.navigate(['/admin/usuarios', creado.id]), 1000);
      },
      error: () => {
        this.error = 'No se pudo crear el usuario.';
        this.guardando = false;
      },
    });
  }
}
