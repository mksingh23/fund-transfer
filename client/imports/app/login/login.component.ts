
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AccountsService } from '../core/services/accounts.service';
import style from './login.component.css';
import template from './login.component.html';

@Component({
  selector: 'login-form',
  template,
  style
})
export class LoginComponent implements OnInit {
  private autorunComputation: Tracker.Computation;
  private showLogin: boolean = true;
  private credentials: SignupCredentials;
  private isLoggedIn: boolean = false;

  constructor(private accountsService: AccountsService,
              private router: Router) {
    this.showLogin = true;
    this._resetCredentialsFields();
  }

  ngOnInit() {
    this.isLoggedIn = this.accountsService.isLoggedIn();
    if (this.isLoggedIn) {
      this.router.navigate(['/']);
    }
  }

  _resetCredentialsFields() {
    this.credentials = {name: '', email: '', password: '', eth_password: '', profile: {}};
  }

  login() {
    this.accountsService.login(this.credentials);
  }

  signup() {
    this.accountsService.signup(this.credentials);
  }

}