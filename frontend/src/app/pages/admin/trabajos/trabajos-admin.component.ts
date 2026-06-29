import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ArchivoLinkComponent } from '../../../components/archivo-link/archivo-link.component';
import { Trabajo } from '../../../models/trabajo.model';
import { TrabajoService } from '../../../servicios/trabajo.service';
import { mensajeErrorApi } from '../../../utils/api-error.util';

@Component({
  selector: 'app-trabajos-admin',
  standalone: true,
  imports: [CommonModule, RouterLink, ArchivoLinkComponent],
  template: `
    <section class="card">
      <h1>Listado de trabajos</h1>
      <p>Admin — limpieza y gestión. DELETE <code>/api/trabajos/{{ '{' }}id{{ '}' }}</code></p>

      @if (error) {
        <p class="error">{{ error }}</p>
      }
      @if (mensaje) {
        <p class="ok">{{ mensaje }}</p>
      }

      @if (cargando) {
        <p>Cargando...</p>
      } @else if (trabajos.length === 0) {
        <p>No hay trabajos registrados.</p>
      } @else {
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Título</th>
              <th>Autor</th>
              <th>Estado</th>
              <th>Documento</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (t of trabajos; track t.id) {
              <tr>
                <td>{{ t.id }}</td>
                <td>{{ t.titulo }}</td>
                <td>{{ t.autorApellido }}, {{ t.autorNombre }}</td>
                <td>{{ t.estado }}</td>
                <td>
                  @if (t.documentoUrl) {
                    <app-archivo-link [url]="t.documentoUrl" label="Ver" />
                  } @else {
                    —
                  }
                </td>
                <td>
                  <button type="button" class="btn-warn" (click)="eliminar(t)">Eliminar</button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      }

      <p><a routerLink="/admin">← Menú admin</a></p>
    </section>
  `,
})
export class TrabajosAdminComponent implements OnInit {
  trabajos: Trabajo[] = [];
  cargando = true;
  error = '';
  mensaje = '';

  constructor(private trabajoService: TrabajoService) {}

  ngOnInit(): void {
    this.cargar();
  }

  eliminar(t: Trabajo): void {
    if (!t.id || !confirm(`¿Eliminar trabajo #${t.id} "${t.titulo}"?`)) {
      return;
    }
    this.trabajoService.baja(t.id).subscribe({
      next: () => {
        this.mensaje = `Trabajo #${t.id} eliminado.`;
        this.cargar();
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'No se pudo eliminar el trabajo.');
      },
    });
  }

  private cargar(): void {
    this.cargando = true;
    this.error = '';
    this.trabajoService.listar(1, 100).subscribe({
      next: (items) => {
        this.trabajos = items;
        this.cargando = false;
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'Error al cargar trabajos.');
        this.cargando = false;
      },
    });
  }
}
