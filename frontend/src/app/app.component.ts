import { Component } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LoginService } from './auth/login.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'JYAA — Entrega 5';

  constructor(
    public loginService: LoginService,
    private router: Router
  ) {}

  get usuario() {
    return this.loginService.getUser();
  }

  logout(): void {
    this.loginService.logout();
    this.router.navigate(['/login']);
  }

  irHome(): string {
    return this.loginService.isLogged() ? this.loginService.homeRoute() : '/';
  }
}
