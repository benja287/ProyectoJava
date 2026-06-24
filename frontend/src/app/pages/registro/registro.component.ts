import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Usuario } from '../../models/usuario.model';
import { UsuarioService } from '../../servicios/usuario.service';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <section class="card">
      <h1>Nuevo usuario</h1>
      <p>Formulario de registración (Práctica 8 — Etapa 1 y 2).</p>

      @if (mensaje) {
        <p class="ok">{{ mensaje }}</p>
      }
      @if (error) {
        <p class="error">{{ error }}</p>
      }

      <form #f="ngForm" (ngSubmit)="guardar()" class="form-grid">
        <label>
          DNI
          <input [(ngModel)]="usuario.dni" name="dni" required />
        </label>
        <label>
          Apellido
          <input [(ngModel)]="usuario.apellido" name="apellido" required />
        </label>
        <label>
          Nombres
          <input [(ngModel)]="usuario.nombres" name="nombres" required />
        </label>
        <label>
          Domicilio
          <input [(ngModel)]="usuario.domicilio" name="domicilio" required />
        </label>
        <label>
          Género
          <select [(ngModel)]="usuario.genero" name="genero" required>
            <option value="">Seleccionar...</option>
            <option value="Femenino">Femenino</option>
            <option value="Masculino">Masculino</option>
            <option value="Otro">Otro</option>
            <option value="Prefiero no decir">Prefiero no decir</option>
          </select>
        </label>
        <label>
          Email
          <input [(ngModel)]="usuario.email" name="email" type="email" required />
        </label>
        <label>
          Contraseña (REST)
          <input
            [(ngModel)]="usuario.password"
            name="password"
            type="password"
            minlength="8"
            placeholder="Mínimo 8 caracteres"
          />
        </label>
        <div class="actions">
          <button type="submit" [disabled]="f.invalid || guardando">Guardar</button>
          <a routerLink="/">Volver al inicio</a>
        </div>
      </form>
    </section>
  `,
})
export class RegistroComponent {
  usuario: Usuario = {
    dni: '',
    apellido: '',
    nombres: '',
    domicilio: '',
    genero: '',
    email: '',
    password: '12345678',
  };

  mensaje = '';
  error = '';
  guardando = false;

  constructor(
    private usuarioService: UsuarioService,
    private router: Router
  ) {}

  guardar(): void {
    this.mensaje = '';
    this.error = '';
    this.guardando = true;
    this.usuarioService.alta(this.usuario).subscribe({
      next: (creado) => {
        this.mensaje = `Usuario registrado (id ${creado.id}).`;
        this.guardando = false;
        setTimeout(() => this.router.navigate(['/admin/usuarios']), 1200);
      },
      error: () => {
        this.error = 'No se pudo registrar el usuario. Verificá el email y el backend.';
        this.guardando = false;
      },
    });
  }
}
