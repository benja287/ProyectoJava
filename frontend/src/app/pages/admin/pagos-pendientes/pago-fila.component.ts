import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ArchivoLinkComponent } from '../../../components/archivo-link/archivo-link.component';
import { Pago } from '../../../models/pago.model';

@Component({
  selector: 'app-pago-fila',
  standalone: true,
  imports: [DecimalPipe, RouterLink, ArchivoLinkComponent],
  host: { style: 'display: contents' },
  template: `
    <tr>
      <td>{{ pago.id }}</td>
      <td>{{ pago.monto | number: '1.2-2' }}</td>
      <td>{{ pago.metodo }}</td>
      <td>{{ pago.estado }}</td>
      <td>{{ pago.fechaRegistro || '—' }}</td>
      <td>
        @if (pago.comprobanteUrl) {
          <app-archivo-link [url]="pago.comprobanteUrl" label="Ver" />
        } @else {
          —
        }
      </td>
      <td class="acciones-celda">
        <a [routerLink]="['/admin/pagos', pago.id]" class="btn-link">Detalle</a>
        <button
          type="button"
          class="btn-ok"
          (click)="aprobar.emit(pago)"
          [disabled]="disabled"
        >
          {{ disabled ? 'Procesando...' : 'Aprobar' }}
        </button>
        <button
          type="button"
          class="btn-warn"
          (click)="rechazar.emit(pago)"
          [disabled]="disabled"
        >
          Rechazar
        </button>
      </td>
    </tr>
  `,
})
export class PagoFilaComponent {
  @Input({ required: true }) pago!: Pago;
  @Input() disabled = false;
  @Output() aprobar = new EventEmitter<Pago>();
  @Output() rechazar = new EventEmitter<Pago>();
}
