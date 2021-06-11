import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

declare var web3;
declare var EthTools;

@Injectable()
export class AccountsService {
  autorunComputation: Tracker.Computation;
  trackerDependency: Tracker.Dependency;
  currentUser: Meteor.User;
  currentUserId: string;
  loggingIn: boolean = false;
  loggedIn: boolean = false;
  services: Array<any>;
  errors: Array<string>;
  isSignup: boolean;
  message: string;

  constructor(private zone: NgZone, private router: Router) {
    this.services = this._getLoginServices();
    this.resetErrors();
    this.isSignup = false;
    this.trackerDependency = new Tracker.Dependency;
    this._initAutorun();
    // this._resetCredentialsFields();
  }

  // _resetCredentialsFields() {
  //     this.credentials = { name: '', email: '', password: '', eth_password: '' };
  // }

  resetErrors() {
    this.errors = [];
    this.message = '';
  }

  singleService(): Object {
    let services = this._getLoginServices();

    return services[0];
  }

  displayName(): string {
    let user: any = this.currentUser;

    if (!user) {
      return '';
    }

    if (user.profile && user.profile.name) {
      return user.profile.name;
    }

    if (user.username) {
      return user.username;
    }

    if (user.emails && user.emails[0] && user.emails[0].address) {
      return user.emails[0].address;
    }

    return '';
  };

  login(credentials: SignupCredentials): void {
    this.resetErrors();

    let email: string = credentials.email;
    let password: string = credentials.password;

    Meteor.loginWithPassword(email, password, (error) => {
      if (error) {
        this.errors.push(error.reason || 'Unknown error');
      }
      else {
        this.router.navigate(['/']);
      }
    });
  }

  // recover() {
  //     this.resetErrors();
  //
  //     Accounts.forgotPassword({ email: this.credentials.email }, (error) => {
  //         if (error) {
  //             this.errors.push(error.reason || "Unknown error");
  //         }
  //         else {
  //             this.message = "You will receive further instruction to you email address!";
  //             this._resetCredentialsFields();
  //         }
  //     });
  // }

  logout(): void {
    Meteor.logout(() => {
      this.loggedIn = false;
      this.router.navigate(['/login']);
    });
  }

  signup(credentials: SignupCredentials): void {
    this.resetErrors();

    Accounts.createUser(credentials, (error) => {
      if (error) {
        this.errors.push(error.reason || 'Unknown error');
      }
      else {
        let userId = Meteor.userId();
        let self = this;
        web3.personal.newAccount(credentials.eth_password, function(error, result) {
          if (!error) {
            Meteor.users.update(userId, {$set: {'profile.eth_address': result}});
            self.router.navigate(['/']);
          }
          else {
            Meteor.users.remove(userId);
            Meteor.logout();
            self.errors.push('Unable to create account. Please try again!');
          }
        });
      }
    });
  }

  _hasPasswordService(): boolean {
    return !!Package['accounts-password'];
  }

  _getLoginServices(): Array<any> {
    let services = Package['accounts-oauth'] ? Accounts.oauth.serviceNames() : [];
    services.sort();

    if (this._hasPasswordService()) {
      services.push('password');
    }

    return _.map(services, function(name) {
      return {name: name};
    });
  }

  _initAutorun(): void {
    this.autorunComputation = Tracker.autorun(() => {
      this.zone.run(() => {
        this.currentUser = Meteor.user();
        this.currentUserId = Meteor.userId();
        this.loggingIn = Meteor.loggingIn();
        this.loggedIn = !!Meteor.user();
        this.trackerDependency.changed();
      });
    });
  }

  getCurrentUser(): Meteor.User {
    this.trackerDependency.depend();
    return this.currentUser;
  }

  getCurrentUserAccount(): Account {
    // this.trackerDependency.depend();
    let user = null; //{name: "", email: "", eth_address: "", identicon: ""};
    if (this.isLoggedIn() && this.currentUser) {
      user = {};
      user._id = this.currentUser._id;
      user.name = this.currentUser.profile.name;
      user.email = this.currentUser.emails ? this.currentUser.emails[0].address : '';
      user.eth_address = this.currentUser.profile.eth_address;
      user.identicon = this.createIdenticon(user.eth_address);
    }
    return user;
  }

  isLoggedIn(): boolean {
    this.trackerDependency.depend();
    return this.loggedIn;
  }

  isLoggingIn(): boolean {
    return this.loggingIn;
  }

  getErrors() {
    return this.errors;
  }

  formatBalance(balanceInWei: string): string {
    return EthTools.formatBalance(balanceInWei, '0,0.0[00] unit');
  }

  createIdenticon(seed, size = 8, scale = 8) {
    return blockies.create({
      seed: seed,
      size: size,
      scale: scale
    }).toDataURL();
  }

  findUserAccount(value: string, key: string = '_id'): Account {
    let user = Meteor.users.findOne({[key]: value});
    if (user) {
      return {
        id: user._id,
        name: user.profile.name,
        email: user.emails ? user.emails[0].address : '',
        eth_address: user.profile.eth_address,
        identicon: this.createIdenticon(user.profile.eth_address)
      };
    }
    else {
      return null;
    }
  }
}