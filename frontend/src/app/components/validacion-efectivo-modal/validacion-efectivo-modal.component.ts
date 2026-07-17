import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PagoService } from '../../servicios/pago.service';

export interface ValidacionEfectivoResultado {
  /** Solo preview; el backend asigna el definitivo al confirmar. */
  numeroReciboPreview?: string;
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
            El número de recibo lo genera el sistema al confirmar. Solo confirmá que tenés el
            efectivo físico.
          </p>

          <label>
            Número de recibo (automático)
            <input
              type="text"
              [ngModel]="numeroReciboPreview"
              [ngModelOptions]="{ standalone: true }"
              readonly
              [attr.aria-busy]="cargandoPreview"
            />
          </label>
          <p class="muted small">
            @if (cargandoPreview) {
              Calculando próximo recibo…
            } @else {
              Vista previa. El correlativo definitivo se asigna al confirmar (si cancelás, no se
              gasta).
            }
          </p>

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
      input[readonly] {
        background: #f3f5f7;
        cursor: default;
      }
    `,
  ],
})
export class ValidacionEfectivoModalComponent implements OnChanges {
  @Input() abierto = false;
  @Input() disabled = false;
  @Output() confirmarValidacion = new EventEmitter<ValidacionEfectivoResultado>();
  @Output() cancelar = new EventEmitter<void>();

  private pagoService = inject(PagoService);

  numeroReciboPreview = '';
  observaciones = '';
  efectivoFisicoRecibido = false;
  errorLocal = '';
  cargandoPreview = false;

  get puedeConfirmar(): boolean {
    return this.efectivoFisicoRecibido && !this.cargandoPreview;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['abierto'] && this.abierto) {
      this.cargarPreview();
    }
  }

  confirmar(): void {
    if (!this.efectivoFisicoRecibido) {
      this.errorLocal = 'Debés confirmar la recepción del efectivo físico.';
      return;
    }
    this.errorLocal = '';
    this.confirmarValidacion.emit({
      numeroReciboPreview: this.numeroReciboPreview || undefined,
      observaciones: this.observaciones.trim() || undefined,
      efectivoFisicoRecibido: true,
    });
  }

  /** Limpia el formulario al cerrar/reabrir desde el padre. */
  reset(): void {
    this.numeroReciboPreview = '';
    this.observaciones = '';
    this.efectivoFisicoRecibido = false;
    this.errorLocal = '';
    this.cargandoPreview = false;
  }

  private cargarPreview(): void {
    this.cargandoPreview = true;
    this.errorLocal = '';
    this.pagoService.proximoRecibo().subscribe({
      next: (r) => {
        this.numeroReciboPreview = r.numeroRecibo;
        this.cargandoPreview = false;
      },
      error: () => {
        this.numeroReciboPreview = 'REC-… (se asigna al confirmar)';
        this.cargandoPreview = false;
      },
    });
  }
}
