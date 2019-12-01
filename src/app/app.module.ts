import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppComponent } from './app.component';
import { AngularFireModule } from '@angular/fire';
import { AngularFireAuthModule } from '@angular/fire/auth';
import { AngularFireDatabaseModule } from '@angular/fire/database';
import { SummarizeEventPipe } from './summarize-event.pipe';
import { ManageTypes } from './manage-types';
import { TypeMapPipe } from './type-map.pipe';
import { NgxMaterialTimepickerModule } from 'ngx-material-timepicker';
import { NgxChartsModule } from '@swimlane/ngx-charts';


@NgModule({
    declarations: [AppComponent, SummarizeEventPipe, ManageTypes, TypeMapPipe],
    imports: [
        BrowserModule,
        AngularFireModule.initializeApp({
            apiKey: 'AIzaSyCl1gfM_tPg777Gfu_zOGWUnnMN4ed0JuI',
            authDomain: 'baby-log-7307f.firebaseapp.com',
            databaseURL: 'https://baby-log-7307f.firebaseio.com',
            projectId: 'baby-log-7307f',
            storageBucket: 'baby-log-7307f.appspot.com',
            messagingSenderId: '121560255493',
        }),
        AngularFireAuthModule,
        AngularFireDatabaseModule,
        NgxMaterialTimepickerModule,
        BrowserAnimationsModule,
        NgxChartsModule,
    ],
    providers: [],
    bootstrap: [AppComponent],
})
export class AppModule {}
