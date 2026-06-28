import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LoginService } from '../../../auth/login.service';
import { METODOS_PAGO } from '../../../models/enums';
import { Pago } from '../../../models/pago.model';
import { PagoService } from '../../../servicios/pago.service';

@Component({
  selector: 'app-pago-participante',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  template: `
    <section class="card">
      <h1>Estado de pago</h1>
      <p>Participante — <code>/api/pagos</code></p>

      @if (error) {
        <p class="error">{{ error }}</p>
      }
      @if (mensaje) {
        <p class="ok">{{ mensaje }}</p>
      }

      @if (pago) {
        <dl class="detalle">
          <dt>ID pago</dt>
          <dd>{{ pago.id }}</dd>
          <dt>Monto</dt>
          <dd>{{ pago.monto | number: '1.2-2' }}</dd>
          <dt>Método</dt>
          <dd>{{ pago.metodo }}</dd>
          <dt>Estado</dt>
          <dd>{{ pago.estado }}</dd>
          @if (pago.motivoRechazo) {
            <dt>Motivo rechazo</dt>
            <dd>{{ pago.motivoRechazo }}</dd>
          }
          <dt>Comprobante</dt>
          <dd>
            @if (pago.comprobanteUrl) {
              <a [href]="pago.comprobanteUrl" target="_blank" rel="noopener">Ver comprobante</a>
            } @else {
              Sin comprobante
            }
          </dd>
        </dl>

        @if (pago.id && !pago.comprobanteUrl) {
          <label class="file-inline">
            Subir comprobante (PDF)
            <input type="file" accept=".pdf" (change)="subirComprobante($event)" />
          </label>
        }
      } @else if (!cargando) {
        <h2>Registrar pago de inscripción</h2>
        <form [formGroup]="form" (ngSubmit)="registrar()" class="form-grid">
          <label>
            Monto
            <input formControlName="monto" type="number" step="0.01" min="0" />
          </label>
          <label>
            Método
            <select formControlName="metodo">
              @for (m of metodos; track m) {
                <option [value]="m">{{ m }}</option>
              }
            </select>
          </label>
          <label class="checkbox-inline">
            <input type="checkbox" formControlName="requiereFactura" />
            Requiere factura
          </label>
          <label>
            ID asociación (opcional)
            <input formControlName="idAsociacion" />
          </label>
          <button type="submit" [disabled]="form.invalid || guardando">Registrar pago</button>
        </form>
      }

      @if (cargando) {
        <p>Cargando...</p>
      }

      <p><a routerLink="/participante">← Menú participante</a></p>
    </section>
  `,
})
export class PagoParticipanteComponent implements OnInit {
  private fb = inject(FormBuilder);

  pago?: Pago;
  metodos = [...METODOS_PAGO];
  cargando = true;
  guardando = false;
  error = '';
  mensaje = '';
  usuarioId?: number;

  form = this.fb.group({
    monto: [0, [Validators.required, Validators.min(0.01)]],
    metodo: [this.metodos[0], Validators.required],
    requiereFactura: [false],
    idAsociacion: [''],
  });

  constructor(
    private loginService: LoginService,
    private pagoService: PagoService
  ) {}

  ngOnInit(): void {
    this.usuarioId = this.loginService.getUser()?.id;
    if (!this.usuarioId) {
      this.error = 'Sesión inválida.';
      this.cargando = false;
      return;
    }
    this.cargarEstado();
  }

  registrar(): void {
    if (!this.usuarioId || this.form.invalid) {
      return;
    }
    const raw = this.form.getRawValue();
    this.guardando = true;
    this.pagoService
      .registrar(this.usuarioId, {
        monto: Number(raw.monto),
        metodo: raw.metodo!,
        requiereFactura: !!raw.requiereFactura,
        idAsociacion: raw.idAsociacion || undefined,
      })
      .subscribe({
        next: (creado) => {
          this.pago = creado;
          this.mensaje = 'Pago registrado. Podés subir el comprobante.';
          this.guardando = false;
        },
        error: () => {
          this.error = 'No se pudo registrar el pago.';
          this.guardando = false;
        },
      });
  }

  subirComprobante(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!this.pago?.id || !file) {
      return;
    }
    this.pagoService.adjuntarComprobante(this.pago.id, file).subscribe({
      next: (actualizado) => {
        this.pago = actualizado;
        this.mensaje = 'Comprobante subido.';
      },
      error: () => (this.error = 'No se pudo subir el comprobante.'),
    });
  }

  private cargarEstado(): void {
    if (!this.usuarioId) {
      return;
    }
    this.pagoService.consultarEstadoPorUsuario(this.usuarioId).subscribe({
      next: (p) => {
        this.pago = p;
        this.cargando = false;
      },
      error: () => {
        this.pago = undefined;
        this.cargando = false;
      },
    });
  }
}
