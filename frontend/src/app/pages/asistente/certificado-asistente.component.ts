import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LoginService } from '../../auth/login.service';
import { etiquetaRol } from '../../models/role-labels';

@Component({
  selector: 'app-certificado-asistente',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="card panel-asistente-detalle">
      <h1>Certificado de asistencia al congreso</h1>
      <p>
        Rol activo: <strong>{{ etiqueta(usuario?.rolActual || 'ASISTENTE') }}</strong>
      </p>
      <p class="muted">
        Acá podés generar el certificado de asistencia al V Congreso Argentino de Agroecología
        una vez validada tu participación como asistente.
      </p>
      <div class="notice-box">
        La emisión del certificado estará disponible próximamente. Tu inscripción ya fue confirmada
        por la organización.
      </div>
      <p><a routerLink="/asistente">← Volver al panel de asistente</a></p>
    </section>
  `,
})
export class CertificadoAsistenteComponent {
  constructor(public loginService: LoginService) {}

  get usuario() {
    return this.loginService.getUser();
  }

  etiqueta(rol: string): string {
    return etiquetaRol(rol);
  }
}
