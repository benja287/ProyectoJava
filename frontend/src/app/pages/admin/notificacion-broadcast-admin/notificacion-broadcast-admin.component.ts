import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NotificacionService } from '../../../servicios/notificacion.service';
import { mensajeErrorApi } from '../../../utils/api-error.util';

@Component({
  selector: 'app-notificacion-broadcast-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="panel-page">
      <div class="panel-hero panel-hero--admin">
        <span class="panel-hero-icon" aria-hidden="true">🔔</span>
        <div>
          <h1>Enviar notificación</h1>
          <p>Avisá a todos los usuarios o filtrá por rol</p>
        </div>
      </div>

      <p class="panel-volver"><a routerLink="/admin">← Volver al panel</a></p>

      @if (error) {
        <p class="error">{{ error }}</p>
      }
      @if (mensaje) {
        <p class="ok">{{ mensaje }}</p>
      }

      <section class="panel-card panel-card--violeta">
        <h2>🔔 Enviar notificación</h2>
        <p class="muted">Avisá a todos los usuarios o filtrá por rol (asistente, autor, evaluador, organizador).</p>
        <form [formGroup]="notifForm" (ngSubmit)="enviarNotificacion()" class="form-grid form-grid-wide">
          <label>
            Título
            <input formControlName="asunto" placeholder="Título de la notificación" />
          </label>
          <label>
            Mensaje
            <textarea formControlName="mensaje" rows="3" placeholder="Mensaje"></textarea>
          </label>
          <label>
            Destinatarios
            <select formControlName="rol">
              <option value="TODOS">Todos</option>
              <option value="ASISTENTE">Asistentes</option>
              <option value="AUTOR">Autores</option>
              <option value="EVALUADOR">Evaluadores</option>
              <option value="ORGANIZADOR_CIENTIFICO">Organizador científico</option>
            </select>
          </label>
          <button type="submit" class="btn-primary-full" [disabled]="notifForm.invalid || enviandoNotif">
            {{ enviandoNotif ? 'Enviando...' : 'Enviar' }}
          </button>
        </form>
      </section>
    </div>
  `,
})
export class NotificacionBroadcastAdminComponent {
  private fb = inject(FormBuilder);
  private notificacionService = inject(NotificacionService);

  error = '';
  mensaje = '';
  enviandoNotif = false;

  notifForm = this.fb.group({
    asunto: ['', Validators.required],
    mensaje: ['', Validators.required],
    rol: ['TODOS'],
  });

  enviarNotificacion(): void {
    if (this.notifForm.invalid) return;
    const raw = this.notifForm.getRawValue();
    this.enviandoNotif = true;
    this.error = '';
    this.notificacionService
      .enviar(raw.asunto!, raw.mensaje!, raw.rol || 'TODOS')
      .subscribe({
        next: (r) => {
          this.mensaje = `Notificación enviada a ${r.enviadas} usuario(s).`;
          this.enviandoNotif = false;
          this.notifForm.reset({ rol: 'TODOS' });
        },
        error: (err) => {
          this.error = mensajeErrorApi(err, 'No se pudo enviar la notificación.');
          this.enviandoNotif = false;
        },
      });
  }
}
