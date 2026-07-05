import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LoginService } from '../../auth/login.service';
import { CongresoConfig } from '../../models/congreso-config.model';
import { CongresoConfigService } from '../../servicios/congreso-config.service';
import { etiquetaRol } from '../../models/role-labels';

@Component({
  selector: 'app-certificado-asistente',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="card panel-asistente-detalle">
      <h1>Certificado de asistencia al congreso</h1>
      <p>
        Rol activo: <strong>{{ etiqueta(usuario?.rolActual || 'ASISTENTE') }}</strong>
      </p>

      @if (!certificadosHabilitados && config?.certificadosDisponiblesDesde) {
        <div class="notice-box notice-box--amber">
          El certificado estará disponible a partir del
          <strong>{{ formatFechaEs(config!.certificadosDisponiblesDesde!) }}</strong>.
        </div>
      } @else if (!config?.certificadosDisponiblesDesde) {
        <div class="notice-box">
          La emisión del certificado aún no fue habilitada por la organización.
        </div>
      } @else {
        <p class="muted">
          Tu inscripción fue confirmada. Podés generar el certificado de asistencia al V Congreso
          Argentino de Agroecología.
        </p>
        <div class="certificado-preview panel-card">
          <h2>Certificado de asistencia</h2>
          <p><strong>{{ usuario?.nombre }} {{ usuario?.apellido }}</strong></p>
          <p>Certifica su participación como asistente al V Congreso Argentino de Agroecología.</p>
          <p class="muted small">La Plata, Argentina · 2027</p>
          <button type="button" class="btn-primary" (click)="imprimir()">Imprimir / guardar PDF</button>
        </div>
      }

      <p><a routerLink="/asistente">← Volver al panel de asistente</a></p>
    </section>
  `,
})
export class CertificadoAsistenteComponent implements OnInit {
  config?: CongresoConfig;

  constructor(
    public loginService: LoginService,
    private congresoConfigService: CongresoConfigService
  ) {}

  ngOnInit(): void {
    this.congresoConfigService.obtener().subscribe({
      next: (c) => (this.config = c),
    });
  }

  get usuario() {
    return this.loginService.getUser();
  }

  get certificadosHabilitados(): boolean {
    const desde = this.config?.certificadosDisponiblesDesde;
    if (!desde) return false;
    const hoy = new Date();
    const [y, m, d] = desde.split('-').map(Number);
    const limite = new Date(y, m - 1, d, 23, 59, 59);
    return hoy >= limite;
  }

  etiqueta(rol: string): string {
    return etiquetaRol(rol);
  }

  formatFechaEs(fecha: string): string {
    const [y, m, d] = fecha.split('-');
    return `${d}/${m}/${y}`;
  }

  imprimir(): void {
    window.print();
  }
}
