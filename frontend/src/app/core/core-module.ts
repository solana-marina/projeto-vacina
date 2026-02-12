import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HomeRedirect } from './layout/home-redirect/home-redirect';
import { MainLayout } from './layout/main-layout/main-layout';
import { SharedModule } from '../shared/shared-module';

@NgModule({
  declarations: [MainLayout, HomeRedirect],
  imports: [CommonModule, SharedModule],
  exports: [MainLayout, HomeRedirect],
})
export class CoreModule {}
