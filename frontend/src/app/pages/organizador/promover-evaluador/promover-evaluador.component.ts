import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Usuario } from '../../../models/usuario.model';
import { UsuarioService } from '../../../servicios/usuario.service';
import { mensajeErrorApi } from '../../../utils/api-error.util';

@Component({
  selector: 'app-promover-evaluador',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="card">
      <h1>Promover evaluadores</h1>
      <p>Organizador científico — PUT <code>/api/usuarios/{{ '{' }}id{{ '}' }}/promover-evaluador</code></p>

      @if (error) {
        <p class="error">{{ error }}</p>
      }
      @if (mensaje) {
        <p class="ok">{{ mensaje }}</p>
      }

      @if (cargando) {
        <p>Cargando usuarios...</p>
      } @else {
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Usuario</th>
              <th>Roles</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            @for (u of usuarios; track u.id) {
              <tr>
                <td>{{ u.id }}</td>
                <td>{{ u.apellido }}, {{ u.nombre }} — {{ u.email }}</td>
                <td>{{ u.roles?.join(', ') }}</td>
                <td>
                  @if (u.roles?.includes('EVALUADOR')) {
                    <span class="muted">Ya es evaluador</span>
                  } @else {
                    <button type="button" (click)="promover(u)" [disabled]="procesandoId === u.id">
                      Promover
                    </button>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      }

      <p><a routerLink="/organizador">← Menú organizador</a></p>
    </section>
  `,
})
export class PromoverEvaluadorComponent implements OnInit {
  usuarios: Usuario[] = [];
  cargando = true;
  procesandoId?: number;
  error = '';
  mensaje = '';

  constructor(private usuarioService: UsuarioService) {}

  ngOnInit(): void {
    this.usuarioService.listar(1, 200).subscribe({
      next: (items) => {
        this.usuarios = items;
        this.cargando = false;
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'No se pudieron cargar usuarios.');
        this.cargando = false;
      },
    });
  }

  promover(u: Usuario): void {
    if (!u.id) {
      return;
    }
    this.procesandoId = u.id;
    this.error = '';
    this.mensaje = '';
    this.usuarioService.promoverEvaluador(u.id).subscribe({
      next: (actualizado) => {
        this.mensaje = `${actualizado.nombre} promovido a evaluador.`;
        this.procesandoId = undefined;
        const idx = this.usuarios.findIndex((x) => x.id === u.id);
        if (idx >= 0) {
          this.usuarios[idx] = actualizado;
        }
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'No se pudo promover al usuario.');
        this.procesandoId = undefined;
      },
    });
  }
}
