import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Pago } from '../../../models/pago.model';
import { PagoService } from '../../../servicios/pago.service';

@Component({
  selector: 'app-pagos-lista',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="card">
      <h1>Listado de pagos</h1>
      <p>Admin — todos los estados. DELETE <code>/api/pagos/{{ '{' }}id{{ '}' }}</code></p>

      @if (error) {
        <p class="error">{{ error }}</p>
      }
      @if (mensaje) {
        <p class="ok">{{ mensaje }}</p>
      }

      @if (cargando) {
        <p>Cargando...</p>
      } @else if (pagos.length === 0) {
        <p>No hay pagos registrados.</p>
      } @else {
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Monto</th>
              <th>Método</th>
              <th>Estado</th>
              <th>Fecha</th>
              <th>Comprobante</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (p of pagos; track p.id) {
              <tr>
                <td>{{ p.id }}</td>
                <td>{{ p.monto | number: '1.2-2' }}</td>
                <td>{{ p.metodo }}</td>
                <td>{{ p.estado }}</td>
                <td>{{ p.fechaRegistro || '—' }}</td>
                <td>
                  @if (p.comprobanteUrl) {
                    <a [href]="p.comprobanteUrl" target="_blank" rel="noopener">Ver</a>
                  } @else {
                    —
                  }
                </td>
                <td>
                  <button type="button" class="btn-warn" (click)="eliminar(p)">Eliminar</button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      }

      <p>
        <a routerLink="/admin/pagos">Validar pendientes</a>
        ·
        <a routerLink="/admin">← Menú admin</a>
      </p>
    </section>
  `,
})
export class PagosListaComponent implements OnInit {
  pagos: Pago[] = [];
  cargando = true;
  error = '';
  mensaje = '';

  constructor(private pagoService: PagoService) {}

  ngOnInit(): void {
    this.cargar();
  }

  eliminar(p: Pago): void {
    if (!p.id || !confirm(`¿Eliminar pago #${p.id}?`)) {
      return;
    }
    this.pagoService.baja(p.id).subscribe({
      next: () => {
        this.mensaje = `Pago #${p.id} eliminado.`;
        this.cargar();
      },
      error: () => {
        this.error = 'No se pudo eliminar el pago.';
      },
    });
  }

  private cargar(): void {
    this.cargando = true;
    this.error = '';
    this.pagoService.listar(1, 100).subscribe({
      next: (items) => {
        this.pagos = items;
        this.cargando = false;
      },
      error: () => {
        this.error = 'Error al cargar pagos.';
        this.cargando = false;
      },
    });
  }
}
