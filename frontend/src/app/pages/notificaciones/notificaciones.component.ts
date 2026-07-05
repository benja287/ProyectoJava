import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Notificacion } from '../../models/notificacion.model';
import { NotificacionService } from '../../servicios/notificacion.service';
import { mensajeErrorApi } from '../../utils/api-error.util';

@Component({
  selector: 'app-notificaciones',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="card">
      <h1>Notificaciones</h1>
      @if (error) {
        <p class="error">{{ error }}</p>
      }
      @if (cargando) {
        <p>Cargando...</p>
      } @else if (items.length === 0) {
        <p class="muted">No tenés notificaciones.</p>
      } @else {
        <ul class="notif-lista">
          @for (n of items; track n.id) {
            <li [class.no-leida]="!n.leida">
              <strong>{{ n.asunto }}</strong>
              <p>{{ n.mensaje }}</p>
              <small class="muted">{{ n.fechaCreacion | date: 'short' }}</small>
              @if (!n.leida) {
                <button type="button" (click)="marcarLeida(n)">Marcar leída</button>
              }
            </li>
          }
        </ul>
        <button type="button" class="btn-secundario" (click)="marcarTodas()">Marcar todas leídas</button>
      }
      <p><a routerLink="/">← Inicio</a></p>
    </section>
  `,
})
export class NotificacionesComponent implements OnInit {
  items: Notificacion[] = [];
  cargando = true;
  error = '';

  constructor(private notificacionService: NotificacionService) {}

  ngOnInit(): void {
    this.cargar();
  }

  marcarLeida(n: Notificacion): void {
    this.notificacionService.marcarLeida(n.id).subscribe({
      next: () => {
        n.leida = true;
      },
    });
  }

  marcarTodas(): void {
    this.notificacionService.marcarTodasLeidas().subscribe({
      next: () => this.cargar(),
    });
  }

  private cargar(): void {
    this.cargando = true;
    this.notificacionService.listar().subscribe({
      next: (items) => {
        this.items = items;
        this.cargando = false;
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'No se pudieron cargar notificaciones.');
        this.cargando = false;
      },
    });
  }
}
