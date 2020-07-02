import { NgModule } from '@angular/core';
import { Home } from './home';
import { AngularFireDatabaseModule } from '@angular/fire/database';
import { NgxMaterialTimepickerModule } from 'ngx-material-timepicker';
import { TypeMapPipe } from './type-map.pipe';
import { SummarizeEventPipe } from './summarize-event.pipe';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@NgModule({
    declarations: [Home, TypeMapPipe, SummarizeEventPipe],
    imports: [
        CommonModule,
        RouterModule.forChild([{path: '', component: Home}]),
        NgxMaterialTimepickerModule,
    ],
})
export class HomeModule {}
