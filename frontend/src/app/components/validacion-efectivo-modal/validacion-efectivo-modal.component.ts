import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface ValidacionEfectivoResultado {
  numeroRecibo: string;
  observaciones?: string;
  efectivoFisicoRecibido: true;
}

@Component({
  selector: 'app-validacion-efectivo-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (abierto) {
      <div class="modal-overlay" (click)="cancelar.emit()" role="presentation">
        <div
          class="modal-card"
          (click)="$event.stopPropagation()"
          role="dialog"
          aria-modal="true"
          aria-labelledby="validacion-efectivo-titulo"
        >
          <h3 id="validacion-efectivo-titulo">Validar pago en efectivo</h3>
          <p class="muted">
            Registrá el cobro físico. El número de recibo y la confirmación de efectivo quedan
            auditados junto con tu usuario y la fecha.
          </p>

          <label>
            Número de recibo *
            <input
              type="text"
              [(ngModel)]="numeroRecibo"
              [ngModelOptions]="{ standalone: true }"
              placeholder="Ej. REC-0042"
              autocomplete="off"
              maxlength="80"
            />
          </label>

          <label>
            Observaciones
            <textarea
              rows="3"
              [(ngModel)]="observaciones"
              [ngModelOptions]="{ standalone: true }"
              placeholder="Opcional: caja, turno, aclaraciones…"
              maxlength="1000"
            ></textarea>
          </label>

          <label class="checkbox-row">
            <input
              type="checkbox"
              [(ngModel)]="efectivoFisicoRecibido"
              [ngModelOptions]="{ standalone: true }"
            />
            <span>Confirmar recepción de efectivo físico *</span>
          </label>

          @if (errorLocal) {
            <p class="error">{{ errorLocal }}</p>
          }

          <div class="modal-actions">
            <button type="button" class="btn-link" (click)="cancelar.emit()" [disabled]="disabled">
              Cancelar
            </button>
            <button
              type="button"
              class="btn-ok"
              (click)="confirmar()"
              [disabled]="disabled || !puedeConfirmar"
            >
              {{ disabled ? 'Procesando…' : 'Confirmar cobro' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .checkbox-row {
        display: flex;
        align-items: flex-start;
        gap: 0.55rem;
        margin-top: 0.75rem;
        font-weight: 500;
      }
      .checkbox-row input {
        margin-top: 0.2rem;
      }
    `,
  ],
})
export class ValidacionEfectivoModalComponent {
  @Input() abierto = false;
  @Input() disabled = false;
  @Output() confirmarValidacion = new EventEmitter<ValidacionEfectivoResultado>();
  @Output() cancelar = new EventEmitter<void>();

  numeroRecibo = '';
  observaciones = '';
  efectivoFisicoRecibido = false;
  errorLocal = '';

  get puedeConfirmar(): boolean {
    return this.efectivoFisicoRecibido && this.numeroRecibo.trim().length > 0;
  }

  confirmar(): void {
    const recibo = this.numeroRecibo.trim();
    if (!recibo) {
      this.errorLocal = 'El número de recibo es obligatorio.';
      return;
    }
    if (!this.efectivoFisicoRecibido) {
      this.errorLocal = 'Debés confirmar la recepción del efectivo físico.';
      return;
    }
    this.errorLocal = '';
    this.confirmarValidacion.emit({
      numeroRecibo: recibo,
      observaciones: this.observaciones.trim() || undefined,
      efectivoFisicoRecibido: true,
    });
  }

  /** Limpia el formulario al cerrar/reabrir desde el padre. */
  reset(): void {
    this.numeroRecibo = '';
    this.observaciones = '';
    this.efectivoFisicoRecibido = false;
    this.errorLocal = '';
  }
}
