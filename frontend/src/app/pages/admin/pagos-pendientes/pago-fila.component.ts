import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Pago } from '../../../models/pago.model';

@Component({
  selector: 'app-pago-fila',
  standalone: true,
  imports: [DecimalPipe],
  template: `
    <tr>
      <td>{{ pago.id }}</td>
      <td>{{ pago.monto | number: '1.2-2' }}</td>
      <td>{{ pago.metodo }}</td>
      <td>{{ pago.estado }}</td>
      <td>{{ pago.fechaRegistro || '—' }}</td>
      <td>
        @if (pago.comprobanteUrl) {
          <a [href]="pago.comprobanteUrl" target="_blank" rel="noopener">Ver</a>
        } @else {
          —
        }
      </td>
      <td>
        <button type="button" class="btn-ok" (click)="aprobar.emit(pago)">Aprobar</button>
        <button type="button" class="btn-warn" (click)="rechazar.emit(pago)">Rechazar</button>
      </td>
    </tr>
  `,
})
export class PagoFilaComponent {
  @Input({ required: true }) pago!: Pago;
  @Output() aprobar = new EventEmitter<Pago>();
  @Output() rechazar = new EventEmitter<Pago>();
}
