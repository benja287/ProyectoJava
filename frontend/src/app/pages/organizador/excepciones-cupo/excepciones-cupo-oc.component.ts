import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Usuario } from '../../../models/usuario.model';
import { UsuarioService } from '../../../servicios/usuario.service';
import { mensajeErrorApi } from '../../../utils/api-error.util';

@Component({
  selector: 'app-excepciones-cupo-oc',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  template: `
    <div class="panel-page">
      <div class="panel-hero panel-hero--admin comite-sub-hero">
        <span class="panel-hero-icon" aria-hidden="true">⬆</span>
        <div>
          <h1>Excepciones de cupo de envío</h1>
          <p>Subí el límite de trabajos a usuarios concretos sin cambiar el cupo global</p>
        </div>
      </div>

      @if (error) {
        <p class="error">{{ error }}</p>
      }
      @if (mensaje) {
        <p class="ok">{{ mensaje }}</p>
      }

      <section class="panel-card">
        <h2>Asignar / actualizar excepción</h2>
        <p class="muted">
          Buscá por email. Dejá vacío un campo para usar el límite global de ese rol. El cupo global
          se configura en
          <a routerLink="/organizador/plazo-envio">Límites de envío</a>.
        </p>
        <form [formGroup]="form" class="form-grid form-grid-wide" (ngSubmit)="guardar()">
          <label class="span-full">
            Email del usuario
            <input formControlName="email" type="email" placeholder="usuario@ejemplo.com" />
          </label>
          <label>
            Máx. AUTOR (excepción)
            <input type="number" min="1" max="20" formControlName="maxTrabajosAutorOverride" />
          </label>
          <label>
            Máx. ASISTENTE (excepción)
            <input type="number" min="1" max="20" formControlName="maxTrabajosAsistenteOverride" />
          </label>
          <label class="span-full">
            Motivo / criterio (opcional)
            <input formControlName="motivo" maxlength="300" />
          </label>
          <div class="actions span-full">
            <button type="submit" class="btn-primary" [disabled]="form.invalid || procesando">
              {{ procesando ? 'Guardando…' : 'Guardar excepción' }}
            </button>
            <button type="button" class="btn-secundario" (click)="quitarExcepcion()" [disabled]="procesando">
              Quitar ambas excepciones
            </button>
          </div>
        </form>
      </section>

      <section class="panel-card" style="margin-top: 1rem">
        <h2>Usuarios con excepción</h2>
        @if (cargando) {
          <p class="muted">Cargando…</p>
        } @else if (!items.length) {
          <p class="muted">Nadie tiene excepción cargada.</p>
        } @else {
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Email</th>
                  <th>Override AUTOR</th>
                  <th>Override ASISTENTE</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @for (u of items; track u.id) {
                  <tr>
                    <td>{{ u.apellido }}, {{ u.nombre }}</td>
                    <td>{{ u.email }}</td>
                    <td>{{ u.maxTrabajosAutorOverride ?? '—' }}</td>
                    <td>{{ u.maxTrabajosAsistenteOverride ?? '—' }}</td>
                    <td>
                      <button type="button" class="btn-link" (click)="cargarEnForm(u)">Editar</button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </section>

      <p class="panel-volver">
        <a routerLink="/organizador">← Volver al panel del comité</a>
        <a routerLink="/organizador/plazo-envio">Cupos globales</a>
      </p>
    </div>
  `,
})
export class ExcepcionesCupoOcComponent implements OnInit {
  private fb = inject(FormBuilder);

  items: Usuario[] = [];
  cargando = true;
  procesando = false;
  error = '';
  mensaje = '';

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    maxTrabajosAutorOverride: [null as number | null],
    maxTrabajosAsistenteOverride: [null as number | null],
    motivo: [''],
  });

  constructor(private usuarioService: UsuarioService) {}

  ngOnInit(): void {
    this.cargarLista();
  }

  cargarLista(): void {
    this.cargando = true;
    this.usuarioService.listarExcepcionesCupo(1, 100).subscribe({
      next: (p) => {
        this.items = p.items;
        this.cargando = false;
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'No se pudo listar excepciones.');
        this.cargando = false;
      },
    });
  }

  cargarEnForm(u: Usuario): void {
    this.form.patchValue({
      email: u.email,
      maxTrabajosAutorOverride: u.maxTrabajosAutorOverride ?? null,
      maxTrabajosAsistenteOverride: u.maxTrabajosAsistenteOverride ?? null,
      motivo: '',
    });
  }

  guardar(): void {
    if (this.form.invalid) {
      return;
    }
    const raw = this.form.getRawValue();
    this.procesando = true;
    this.error = '';
    this.mensaje = '';
    this.usuarioService.listar(1, 5, { email: raw.email!.trim() }).subscribe({
      next: (users) => {
        const exacto = users.find((u) => u.email.toLowerCase() === raw.email!.trim().toLowerCase());
        if (!exacto?.id) {
          this.error = 'No se encontró un usuario con ese email.';
          this.procesando = false;
          return;
        }
        const autor = raw.maxTrabajosAutorOverride;
        const asistente = raw.maxTrabajosAsistenteOverride;
        this.usuarioService
          .actualizarCuposEnvio(exacto.id, {
            maxTrabajosAutorOverride:
              autor != null && String(autor).trim() !== '' ? Number(autor) : null,
            maxTrabajosAsistenteOverride:
              asistente != null && String(asistente).trim() !== '' ? Number(asistente) : null,
            motivo: raw.motivo?.trim() || undefined,
          })
          .subscribe({
            next: () => {
              this.mensaje = `Excepción guardada para ${exacto.email}.`;
              this.procesando = false;
              this.cargarLista();
            },
            error: (err) => {
              this.error = mensajeErrorApi(err, 'No se pudo guardar la excepción.');
              this.procesando = false;
            },
          });
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'No se pudo buscar el usuario.');
        this.procesando = false;
      },
    });
  }

  quitarExcepcion(): void {
    const email = this.form.getRawValue().email?.trim();
    if (!email) {
      this.error = 'Indicá el email del usuario.';
      return;
    }
    this.procesando = true;
    this.error = '';
    this.usuarioService.listar(1, 5, { email }).subscribe({
      next: (users) => {
        const exacto = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
        if (!exacto?.id) {
          this.error = 'No se encontró un usuario con ese email.';
          this.procesando = false;
          return;
        }
        this.usuarioService
          .actualizarCuposEnvio(exacto.id, {
            maxTrabajosAutorOverride: null,
            maxTrabajosAsistenteOverride: null,
            motivo: 'Se quitaron las excepciones de cupo.',
          })
          .subscribe({
            next: () => {
              this.mensaje = `Excepciones quitadas para ${exacto.email}.`;
              this.form.patchValue({
                maxTrabajosAutorOverride: null,
                maxTrabajosAsistenteOverride: null,
              });
              this.procesando = false;
              this.cargarLista();
            },
            error: (err) => {
              this.error = mensajeErrorApi(err, 'No se pudo quitar la excepción.');
              this.procesando = false;
            },
          });
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'No se pudo buscar el usuario.');
        this.procesando = false;
      },
    });
  }
}
