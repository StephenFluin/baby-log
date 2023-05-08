import { NgModule } from '@angular/core';
import { Home } from './home';
import { NgxMatTimepickerModule } from 'ngx-mat-timepicker';
import { TypeMapPipe } from './type-map.pipe';
import { SummarizeEventPipe } from './summarize-event.pipe';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { History } from '../history';

@NgModule({
    declarations: [Home, History, TypeMapPipe, SummarizeEventPipe],
    imports: [
        CommonModule,
        RouterModule.forChild([
            { path: '', component: Home, pathMatch: 'full' },
            { path: ':code/:name/history', component: History },
            { path: ':code/history', component: History },
            { path: ':code/:name', component: Home },
            { path: ':code', component: Home },
        ]),
        NgxMatTimepickerModule,
    ],
})
export class HomeModule {}
