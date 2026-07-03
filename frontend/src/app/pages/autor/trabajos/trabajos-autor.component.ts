import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ArchivoLinkComponent } from '../../../components/archivo-link/archivo-link.component';
import {
  FilterBarComponent,
  FilterFieldConfig,
} from '../../../components/filter-bar/filter-bar.component';
import { LoginService } from '../../../auth/login.service';
import { ESTADOS_TRABAJO, TIPOS_TRABAJO } from '../../../models/enums';
import { Trabajo } from '../../../models/trabajo.model';
import { TrabajoService } from '../../../servicios/trabajo.service';
import { mensajeErrorApi } from '../../../utils/api-error.util';
import { filtroFromParams, queryParamsFromFiltro } from '../../../utils/filtro-params.util';

@Component({
  selector: 'app-trabajos-autor',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, ArchivoLinkComponent, FilterBarComponent],
  template: `
    <section class="card">
      <h1>{{ esPropuestaTaller ? 'Proponer taller' : 'Mis trabajos' }}</h1>
      @if (perfilAsistente && esPropuestaTaller) {
        <p>
          <strong>Rol asistente</strong> — enviá tu propuesta de taller para evaluación del comité.
        </p>
      } @else if (perfilAsistente) {
        <p>
          <strong>Rol asistente</strong> — al crear un trabajo el backend te asigna el rol
          <strong>Autor</strong> automáticamente (<code>POST /api/trabajos</code>).
          Podés subir el PDF y enviarlo igual que en el panel de autor.
        </p>
      } @else {
        <p>Autor — <code>/api/trabajos</code></p>
      }

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

      <app-filter-bar
        [fields]="filterFields"
        [values]="filtros"
        (filterApply)="onFiltrosAplicar($event)"
        (filterClear)="onFiltrosLimpiar()"
      />

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

      <p><a [routerLink]="menuVolver">← {{ etiquetaVolver }}</a></p>
    </section>
  `,
})
export class TrabajosAutorComponent implements OnInit {
  private fb = inject(FormBuilder);

  readonly filterFields: FilterFieldConfig[] = [
    { key: 'titulo', label: 'Título', placeholder: 'Buscar por título' },
    { key: 'resumen', label: 'Resumen', placeholder: 'Buscar en resumen' },
    { key: 'ejeTematico', label: 'Eje temático', placeholder: 'Buscar eje' },
    {
      key: 'estado',
      label: 'Estado',
      type: 'select',
      options: ESTADOS_TRABAJO.map((e) => ({ value: e, label: e })),
    },
  ];
  readonly filterKeys = ['titulo', 'resumen', 'ejeTematico', 'estado'] as const;

  trabajos: Trabajo[] = [];
  filtros: Record<string, string> = {};
  tipos = [...TIPOS_TRABAJO];
  cargando = true;
  guardando = false;
  error = '';
  mensaje = '';
  autorId?: number;
  perfilAsistente = false;
  esPropuestaTaller = false;
  menuVolver = '/autor';
  etiquetaVolver = 'Menú autor';

  form = this.fb.group({
    titulo: ['', Validators.required],
    resumen: [''],
    ejeTematico: [''],
    tipo: [this.tipos[0], Validators.required],
    coautoresTexto: [''],
  });

  constructor(
    private loginService: LoginService,
    private trabajoService: TrabajoService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const perfil = this.route.snapshot.data['perfilTrabajos'];
    this.perfilAsistente = perfil === 'asistente' || perfil === 'participante';
    this.esPropuestaTaller = this.route.snapshot.data['tipoTaller'] === true;
    this.menuVolver = this.perfilAsistente ? '/asistente' : '/autor';
    this.etiquetaVolver = this.perfilAsistente ? 'Panel asistente' : 'Menú autor';

    if (this.esPropuestaTaller) {
      this.form.patchValue({ tipo: 'PROPUESTA_TALLER' });
    }

    this.autorId = this.loginService.getUser()?.id;
    if (!this.autorId) {
      this.error = 'Sesión inválida.';
      this.cargando = false;
      return;
    }

    this.route.queryParamMap.subscribe((params) => {
      this.filtros = filtroFromParams(params, this.filterKeys);
      this.cargar();
    });
  }

  onFiltrosAplicar(values: Record<string, string>): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: queryParamsFromFiltro(values, this.filterKeys),
    });
  }

  onFiltrosLimpiar(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: queryParamsFromFiltro({}, this.filterKeys),
    });
  }

  crear(): void {
    if (!this.autorId || this.form.invalid) {
      return;
    }
    const raw = this.form.getRawValue();
    const coautores = raw.coautoresTexto
      ? raw.coautoresTexto.split(',').map((s) => s.trim()).filter(Boolean)
      : [];
    const rolesAntes = new Set(this.loginService.getUser()?.roles ?? []);
    this.guardando = true;
    this.error = '';
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
          this.loginService.refreshUser().subscribe({
            next: (u) => {
              const rolesAhora = u.roles ?? [];
              if (
                this.perfilAsistente &&
                !rolesAntes.has('AUTOR') &&
                rolesAhora.includes('AUTOR')
              ) {
                this.mensaje =
                  'Trabajo creado. Se te asignó el rol Autor automáticamente. Podés cambiar de perfil desde el header.';
              } else {
                this.mensaje = 'Trabajo creado en borrador.';
              }
              this.guardando = false;
              this.form.reset({ tipo: this.tipos[0] });
              this.cargar();
            },
            error: () => {
              this.mensaje = 'Trabajo creado en borrador.';
              this.guardando = false;
              this.form.reset({ tipo: this.tipos[0] });
              this.cargar();
            },
          });
        },
        error: (err) => {
          this.error = mensajeErrorApi(err, 'No se pudo crear el trabajo.');
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
      error: (err) => (this.error = mensajeErrorApi(err, 'No se pudo subir el PDF.')),
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
      error: (err) => (this.error = mensajeErrorApi(err, 'No se pudo enviar el trabajo.')),
    });
  }

  private cargar(): void {
    if (!this.autorId) {
      return;
    }
    this.cargando = true;
    this.trabajoService.listar(1, 100, { ...this.filtros, autorId: this.autorId }).subscribe({
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
