import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ArchivoLinkComponent } from '../../../components/archivo-link/archivo-link.component';
import {
  CATEGORIAS_INSCRIPCION,
  etiquetaCategoria,
} from '../../../models/inscripcion.model';
import { ArancelesConfig } from '../../../models/aranceles.model';
import { ArancelesService } from '../../../servicios/aranceles.service';
import { mensajeErrorApi } from '../../../utils/api-error.util';

@Component({
  selector: 'app-congreso-aranceles-admin',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, ArchivoLinkComponent],
  template: `
    <div class="panel-page">
      <div class="panel-hero panel-hero--admin">
        <span class="panel-hero-icon" aria-hidden="true">💰</span>
        <div>
          <h1>Aranceles y pago</h1>
          <p>Precios por categoría, alias/QR y publicación para inscripción</p>
        </div>
      </div>

      <p class="panel-volver"><a routerLink="/admin/congreso">← Volver a Congreso</a></p>

      @if (error) {
        <p class="error">{{ error }}</p>
      }
      @if (mensaje) {
        <p class="ok">{{ mensaje }}</p>
      }

      @if (config) {
        <section class="panel-card" [class.panel-card--indigo]="config.publicados">
          <h2>Estado</h2>
          @if (config.publicados) {
            <p class="ok">Aranceles publicados: los participantes ya ven precios y datos de pago.</p>
          } @else {
            <p class="aviso-amarillo" style="margin: 0">
              Borrador: los usuarios <strong>no</strong> pueden enviar inscripción ni ver precio/alias/QR
              hasta que publiques.
            </p>
          }
          @if (!config.ventanaInscripcionAbierta) {
            <p class="muted" style="margin-top: 0.75rem">
              La ventana de fechas de inscripción no está abierta (configurala en Ventanas de tiempo).
            </p>
          }
        </section>
      }

      <section class="panel-card" style="margin-top: 1.25rem">
        <h2>Precios por categoría</h2>
        <p class="muted">Moneda ARS o USD (extranjero suele ser USD).</p>
        <form [formGroup]="form" class="aranceles-form">
          <div formArrayName="aranceles" class="aranceles-grid">
            @for (ctrl of arancelesControls; track ctrl; let i = $index) {
              <div class="arancel-row" [formGroupName]="i">
                <strong>{{ etiquetaCategoria(ctrl.get('categoria')?.value || '') }}</strong>
                <label>
                  Monto
                  <input type="number" formControlName="monto" min="1" step="1" />
                </label>
                <label>
                  Moneda
                  <select formControlName="moneda">
                    <option value="ARS">ARS</option>
                    <option value="USD">USD</option>
                  </select>
                </label>
              </div>
            }
          </div>

          <h3 style="margin-top: 1.5rem">Datos de pago</h3>
          <label>
            Alias / CBU / CVU
            <input formControlName="aliasPago" placeholder="ej. congreso.agro.mp" />
          </label>
          <label>
            Instrucciones (opcional)
            <textarea
              formControlName="instruccionesPago"
              rows="3"
              placeholder="Titular de la cuenta, banco, etc."
            ></textarea>
          </label>

          <div class="qr-block">
            <h3>QR de pago</h3>
            @if (config?.qrPagoUrl) {
              <p>
                <app-archivo-link [url]="config!.qrPagoUrl!" label="Ver / descargar QR actual" />
              </p>
              <button type="button" class="btn-secundario" (click)="quitarQr()" [disabled]="guardando">
                Quitar QR
              </button>
            }
            <label class="upload-box">
              Subir imagen QR (PNG/JPG)
              <input type="file" accept=".png,.jpg,.jpeg,.webp" (change)="onQr($event)" />
            </label>
          </div>

          <div class="actions" style="margin-top: 1.25rem; display: flex; flex-wrap: wrap; gap: 0.6rem">
            <button type="button" class="btn-secundario" (click)="guardar(null)" [disabled]="guardando || form.invalid">
              {{ guardando ? 'Guardando…' : 'Guardar borrador' }}
            </button>
            <button type="button" class="btn-ok" (click)="guardar(true)" [disabled]="guardando || form.invalid">
              Publicar aranceles
            </button>
            @if (config?.publicados) {
              <button type="button" class="btn-warn" (click)="guardar(false)" [disabled]="guardando">
                Despublicar
              </button>
            }
          </div>
          <p class="muted" style="margin-top: 0.75rem">
            Para publicar: todas las categorías con monto &gt; 0 y al menos alias o QR.
          </p>
        </form>
      </section>
    </div>
  `,
  styles: [
    `
      .aranceles-grid {
        display: grid;
        gap: 0.75rem;
      }
      .arancel-row {
        display: grid;
        grid-template-columns: 1.4fr 1fr 0.7fr;
        gap: 0.6rem;
        align-items: end;
        padding: 0.65rem 0;
        border-bottom: 1px solid #e6e2f0;
      }
      @media (max-width: 720px) {
        .arancel-row {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class CongresoArancelesAdminComponent implements OnInit {
  private fb = inject(FormBuilder);
  private arancelesService = inject(ArancelesService);

  config: ArancelesConfig | null = null;
  error = '';
  mensaje = '';
  guardando = false;

  form = this.fb.group({
    aliasPago: [''],
    instruccionesPago: [''],
    aranceles: this.fb.array(
      CATEGORIAS_INSCRIPCION.map((c) =>
        this.fb.group({
          categoria: [c.value],
          monto: [0, [Validators.required, Validators.min(1)]],
          moneda: [c.value === 'EXTRANJERO' ? 'USD' : 'ARS', Validators.required],
        })
      )
    ),
  });

  get arancelesControls() {
    return this.form.controls.aranceles.controls;
  }

  readonly etiquetaCategoria = etiquetaCategoria;

  ngOnInit(): void {
    this.cargar();
  }

  onQr(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) {
      return;
    }
    this.guardando = true;
    this.error = '';
    this.arancelesService.subirQr(file).subscribe({
      next: (cfg) => {
        this.aplicar(cfg);
        this.mensaje = 'QR de pago actualizado.';
        this.guardando = false;
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'No se pudo subir el QR.');
        this.guardando = false;
      },
    });
  }

  quitarQr(): void {
    this.guardando = true;
    this.arancelesService.quitarQr().subscribe({
      next: (cfg) => {
        this.aplicar(cfg);
        this.mensaje = 'QR eliminado.';
        this.guardando = false;
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'No se pudo quitar el QR.');
        this.guardando = false;
      },
    });
  }

  guardar(publicar: boolean | null): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    this.guardando = true;
    this.error = '';
    this.mensaje = '';
    this.arancelesService
      .guardar({
        aliasPago: raw.aliasPago ?? '',
        instruccionesPago: raw.instruccionesPago ?? '',
        publicar: publicar === null ? undefined : publicar,
        aranceles: (raw.aranceles ?? []).map((a) => ({
          categoria: a.categoria!,
          monto: Number(a.monto),
          moneda: a.moneda!,
        })),
      })
      .subscribe({
        next: (cfg) => {
          this.aplicar(cfg);
          this.mensaje =
            publicar === true
              ? 'Aranceles publicados correctamente.'
              : publicar === false
                ? 'Aranceles despublicados.'
                : 'Borrador guardado.';
          this.guardando = false;
        },
        error: (err) => {
          this.error = mensajeErrorApi(err, 'No se pudo guardar.');
          this.guardando = false;
        },
      });
  }

  private cargar(): void {
    this.arancelesService.obtener().subscribe({
      next: (cfg) => this.aplicar(cfg),
      error: (err) => {
        this.error = mensajeErrorApi(err, 'No se pudo cargar la configuración.');
      },
    });
  }

  private aplicar(cfg: ArancelesConfig): void {
    this.config = cfg;
    const porCat = new Map(cfg.aranceles.map((a) => [a.categoria, a]));
    const aranceles = CATEGORIAS_INSCRIPCION.map((c) => {
      const a = porCat.get(c.value);
      return {
        categoria: c.value,
        monto: a?.monto ?? 0,
        moneda: a?.moneda ?? (c.value === 'EXTRANJERO' ? 'USD' : 'ARS'),
      };
    });
    this.form.patchValue({
      aliasPago: cfg.aliasPago ?? '',
      instruccionesPago: cfg.instruccionesPago ?? '',
      aranceles,
    });
  }
}
