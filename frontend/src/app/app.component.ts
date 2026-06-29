import {
  Component,
  ElementRef,
  HostListener,
  ViewChild,
} from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LoginService } from './auth/login.service';
import { mensajeErrorApi } from './utils/api-error.util';
import { etiquetaRol } from './models/role-labels';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'JYAA — Entrega 5';
  menuAbierto = false;
  cambiandoRol = false;
  errorRol = '';

  @ViewChild('userMenu') userMenu?: ElementRef<HTMLElement>;

  constructor(
    public loginService: LoginService,
    private router: Router
  ) {}

  get usuario() {
    return this.loginService.getUser();
  }

  etiquetaRol(rol: string | null | undefined): string {
    return rol ? etiquetaRol(rol) : '—';
  }

  toggleMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.menuAbierto = !this.menuAbierto;
  }

  cerrarMenu(): void {
    this.menuAbierto = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.menuAbierto) {
      return;
    }
    const el = this.userMenu?.nativeElement;
    if (el && !el.contains(event.target as Node)) {
      this.menuAbierto = false;
    }
  }

  elegirRol(rol: string, event: MouseEvent): void {
    event.stopPropagation();
    if (this.cambiandoRol || rol === this.usuario?.rolActual) {
      this.cerrarMenu();
      if (rol === this.usuario?.rolActual) {
        this.router.navigateByUrl(this.loginService.homeRoute());
      }
      return;
    }
    this.cambiandoRol = true;
    this.errorRol = '';
    this.loginService.cambiarRolActual(rol).subscribe({
      next: () => {
        this.cambiandoRol = false;
        this.cerrarMenu();
        this.router.navigateByUrl(this.loginService.homeRoute());
      },
      error: (err) => {
        this.cambiandoRol = false;
        this.errorRol = mensajeErrorApi(err, 'No se pudo cambiar el perfil.');
      },
    });
  }

  logout(): void {
    this.cerrarMenu();
    this.loginService.logout();
    this.router.navigate(['/login']);
  }

  irHome(): string {
    return this.loginService.isLogged()
      ? this.loginService.rutaPanel()
      : '/';
  }
}
