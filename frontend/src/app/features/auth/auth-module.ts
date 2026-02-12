import { NgModule } from '@angular/core';

import { SharedModule } from '../../shared/shared-module';
import { AuthRoutingModule } from './auth-routing-module';
import { Login } from './pages/login/login';

@NgModule({
  declarations: [Login],
  imports: [SharedModule, AuthRoutingModule],
})
export class AuthModule {}
