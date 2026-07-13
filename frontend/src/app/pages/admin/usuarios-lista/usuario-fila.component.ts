/**
 * Fila de la tabla de usuarios (componente hijo).
 */
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Usuario } from '../../../models/usuario.model';

@Component({
  selector: 'app-usuario-fila',
  standalone: true,
  imports: [RouterLink],
  host: { style: 'display: contents' },
  template: `
    <tr>
      <td>{{ usuario.id }}</td>
      <td>{{ usuario.apellido }}, {{ usuario.nombre }}</td>
      <td>{{ usuario.email }}</td>
      <td>
        <span [class.badge-ok]="usuario.activo" [class.badge-off]="!usuario.activo">
          {{ usuario.activo ? 'Activo' : 'Inactivo' }}
        </span>
      </td>
      <td>{{ usuario.roles?.join(', ') }}</td>
      <td class="acciones-tabla">
        <a [routerLink]="['/admin/usuarios', usuario.id]" class="btn-link">Detalle</a>
        <button type="button" class="btn-link" (click)="editar.emit(usuario)">Editar</button>
        <button type="button" class="btn-link" (click)="toggleActivo.emit(usuario)">
          {{ usuario.activo ? 'Inhabilitar' : 'Habilitar' }}
        </button>
        <button type="button" class="btn-link danger" (click)="eliminar.emit(usuario)">Eliminar</button>
      </td>
    </tr>
  `,
})
export class UsuarioFilaComponent {
  @Input({ required: true }) usuario!: Usuario;
  @Output() editar = new EventEmitter<Usuario>();
  @Output() toggleActivo = new EventEmitter<Usuario>();
  @Output() eliminar = new EventEmitter<Usuario>();
}
