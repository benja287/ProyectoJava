import { NgModule } from '@angular/core';
import { UserEditModalComponent } from './user-edit-modal.component';

/**
 * Módulo cargado dinámicamente al abrir el modal de edición.
 * Agrupa el componente y sus dependencias de Angular Material en un chunk separado.
 */
@NgModule({
  imports: [UserEditModalComponent],
  exports: [UserEditModalComponent],
})
export class UserEditModalModule {}

export { UserEditModalComponent } from './user-edit-modal.component';
