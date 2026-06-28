import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Usuario } from '../../../models/usuario.model';

@Component({
  selector: 'app-usuario-fila',
  standalone: true,
  imports: [RouterLink],
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
      <td>
        <a [routerLink]="['/admin/usuarios', usuario.id]">Detalle</a>
        <button type="button" class="btn-link" (click)="eliminar.emit(usuario)">Baja</button>
      </td>
    </tr>
  `,
})
export class UsuarioFilaComponent {
  @Input({ required: true }) usuario!: Usuario;
  @Output() eliminar = new EventEmitter<Usuario>();
}
