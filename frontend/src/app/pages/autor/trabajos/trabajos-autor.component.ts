import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ArchivoLinkComponent } from '../../../components/archivo-link/archivo-link.component';
import { LoginService } from '../../../auth/login.service';
import { TIPOS_TRABAJO } from '../../../models/enums';
import { Trabajo } from '../../../models/trabajo.model';
import { TrabajoService } from '../../../servicios/trabajo.service';

@Component({
  selector: 'app-trabajos-autor',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, ArchivoLinkComponent],
  template: `
    <section class="card">
      <h1>Mis trabajos</h1>
      <p>Autor — <code>/api/trabajos</code></p>

      @if (error) {
        <p class="error">{{ error }}</p>
      }
      @if (mensaje) {
        <p class="ok">{{ mensaje }}</p>
      }

      <h2>Nuevo trabajo</h2>
      <form [formGroup]="form" (ngSubmit)="crear()" class="form-grid">
        <label>
          Título
          <input formControlName="titulo" />
        </label>
        <label>
          Resumen
          <textarea formControlName="resumen" rows="3"></textarea>
        </label>
        <label>
          Eje temático
          <input formControlName="ejeTematico" />
        </label>
        <label>
          Tipo
          <select formControlName="tipo">
            @for (t of tipos; track t) {
              <option [value]="t">{{ t }}</option>
            }
          </select>
        </label>
        <label>
          Coautores (separados por coma)
          <input formControlName="coautoresTexto" placeholder="Apellido Nombre, ..." />
        </label>
        <button type="submit" [disabled]="form.invalid || guardando">Crear borrador</button>
      </form>

      <h2>Listado</h2>
      @if (cargando) {
        <p>Cargando...</p>
      } @else if (trabajos.length === 0) {
        <p>No tenés trabajos cargados.</p>
      } @else {
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Título</th>
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
                <td>{{ t.estado }}</td>
                <td>
                  @if (t.documentoUrl) {
                    <app-archivo-link [url]="t.documentoUrl" label="Ver" />
                  } @else {
                    —
                  }
                </td>
                <td class="acciones-celda">
                  @if (t.estado === 'BORRADOR') {
                    <label class="file-inline">
                      PDF
                      <input type="file" accept=".pdf" (change)="subirPdf(t, $event)" />
                    </label>
                    <button type="button" (click)="enviar(t)" [disabled]="!t.documentoUrl">Enviar</button>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      }

      <p><a routerLink="/autor">← Menú autor</a></p>
    </section>
  `,
})
export class TrabajosAutorComponent implements OnInit {
  private fb = inject(FormBuilder);

  trabajos: Trabajo[] = [];
  tipos = [...TIPOS_TRABAJO];
  cargando = true;
  guardando = false;
  error = '';
  mensaje = '';
  autorId?: number;

  form = this.fb.group({
    titulo: ['', Validators.required],
    resumen: [''],
    ejeTematico: [''],
    tipo: [this.tipos[0], Validators.required],
    coautoresTexto: [''],
  });

  constructor(
    private loginService: LoginService,
    private trabajoService: TrabajoService
  ) {}

  ngOnInit(): void {
    this.autorId = this.loginService.getUser()?.id;
    if (!this.autorId) {
      this.error = 'Sesión inválida.';
      this.cargando = false;
      return;
    }
    this.cargar();
  }

  crear(): void {
    if (!this.autorId || this.form.invalid) {
      return;
    }
    const raw = this.form.getRawValue();
    const coautores = raw.coautoresTexto
      ? raw.coautoresTexto.split(',').map((s) => s.trim()).filter(Boolean)
      : [];
    this.guardando = true;
    this.trabajoService
      .crear({
        autorId: this.autorId,
        trabajo: {
          titulo: raw.titulo!,
          resumen: raw.resumen || undefined,
          ejeTematico: raw.ejeTematico || undefined,
          tipo: raw.tipo!,
          coautores,
        },
      })
      .subscribe({
        next: () => {
          this.mensaje = 'Trabajo creado en borrador.';
          this.guardando = false;
          this.form.reset({ tipo: this.tipos[0] });
          this.cargar();
        },
        error: () => {
          this.error = 'No se pudo crear el trabajo.';
          this.guardando = false;
        },
      });
  }

  subirPdf(trabajo: Trabajo, event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!trabajo.id || !file) {
      return;
    }
    this.trabajoService.adjuntarDocumento(trabajo.id, file).subscribe({
      next: (actualizado) => {
        this.mensaje = 'Documento adjuntado.';
        const idx = this.trabajos.findIndex((t) => t.id === trabajo.id);
        if (idx >= 0) {
          this.trabajos[idx] = actualizado;
        }
      },
      error: () => (this.error = 'No se pudo subir el PDF.'),
    });
  }

  enviar(trabajo: Trabajo): void {
    if (!trabajo.id) {
      return;
    }
    this.trabajoService.enviar(trabajo.id).subscribe({
      next: (actualizado) => {
        this.mensaje = 'Trabajo enviado a evaluación.';
        const idx = this.trabajos.findIndex((t) => t.id === trabajo.id);
        if (idx >= 0) {
          this.trabajos[idx] = actualizado;
        }
      },
      error: () => (this.error = 'No se pudo enviar el trabajo.'),
    });
  }

  private cargar(): void {
    if (!this.autorId) {
      return;
    }
    this.cargando = true;
    this.trabajoService.listar(1, 100, this.autorId).subscribe({
      next: (items) => {
        this.trabajos = items;
        this.cargando = false;
      },
      error: () => {
        this.error = 'Error al cargar trabajos.';
        this.cargando = false;
      },
    });
  }
}
