import { NgModule } from '@angular/core';

import { SharedModule } from '../../shared/shared-module';
import { Pendencias } from './pages/pendencias/pendencias';
import { StudentDetail } from './pages/student-detail/student-detail';
import { Students } from './pages/students/students';
import { SchoolRoutingModule } from './school-routing-module';

@NgModule({
  declarations: [Students, StudentDetail, Pendencias],
  imports: [SharedModule, SchoolRoutingModule],
})
export class SchoolModule {}
