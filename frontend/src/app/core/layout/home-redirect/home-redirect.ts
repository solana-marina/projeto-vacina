import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-home-redirect',
  standalone: false,
  templateUrl: './home-redirect.html',
  styleUrl: './home-redirect.scss',
})
export class HomeRedirect implements OnInit {
  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    const session = this.authService.getCurrentSession();
    if (!session) {
      this.router.navigate(['/auth/login']);
      return;
    }

    if (session.role === 'ADMIN') {
      this.router.navigate(['/admin']);
      return;
    }

    if (session.role === 'SCHOOL_OPERATOR' || session.role === 'SCHOOL_MANAGER') {
      this.router.navigate(['/school']);
      return;
    }

    this.router.navigate(['/health']);
  }
}
