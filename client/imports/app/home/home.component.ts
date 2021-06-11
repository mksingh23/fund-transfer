import { Component, NgZone, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AccountsService } from '../core/services/accounts.service';
import style from './home.component.css';
import template from './home.component.html';

declare var EthAccounts;

@Component({
  selector: 'app-home',
  template,
  style
})
export class HomeComponent implements OnInit {
  private autorunComputation: Tracker.Computation;
  private currentUser: Account;
  private currentEthAccount: any;
  private isBalanceUpdated: boolean = false;

  constructor(private zone: NgZone,
              private accountsService: AccountsService,
              private router: Router) {
  }

  ngOnInit() {
    this._initAutorun();
  }

  _initAutorun(): void {
    let self = this;
    this.autorunComputation = Tracker.autorun(() => {
      this.zone.run(() => {
        if (self.accountsService.isLoggedIn()) {
          self.currentUser = self.accountsService.getCurrentUserAccount();
          if (self.currentUser) {
            self.currentEthAccount = EthAccounts.findOne({address: self.currentUser.eth_address});
            if (self.currentEthAccount) {
              self.currentEthAccount.balance_unit = self.accountsService.formatBalance(self.currentEthAccount.balance);
              self.isBalanceUpdated = false;
              setTimeout(() => {
                self.isBalanceUpdated = true;
              }, 100);
            }
          }
        }
        else if (!self.accountsService.isLoggingIn()) {
          self.router.navigate(['/login']);
        }
      });
    });
  }

}