import { Injectable, Injector, createNgModule } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Usuario } from '../models/usuario.model';

@Injectable({ providedIn: 'root' })
export class UsuarioEdicionDialogService {
  constructor(
    private dialog: MatDialog,
    private injector: Injector
  ) {}

  abrir(usuario: Usuario): Observable<Usuario | undefined> {
    return from(import('../pages/admin/usuarios-lista/user-edit-modal.module')).pipe(
      switchMap(({ UserEditModalModule, UserEditModalComponent }) => {
        createNgModule(UserEditModalModule, this.injector);
        return this.dialog
          .open(UserEditModalComponent, {
            width: '560px',
            maxWidth: '95vw',
            data: { usuario },
            autoFocus: 'first-titled-element',
          })
          .afterClosed();
      })
    );
  }
}
