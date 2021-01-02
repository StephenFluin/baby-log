import { BrowserModule } from '@angular/platform-browser';
import { NgModule, ErrorHandler } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppComponent } from './app.component';
import { AngularFireModule } from '@angular/fire';
import { AngularFireAuthModule } from '@angular/fire/auth';
import { RouterModule } from '@angular/router';
import { MatMenuModule } from '@angular/material/menu';
import { AngularFireDatabaseModule } from '@angular/fire/database';
import Bugsnag from '@bugsnag/js';
import { BugsnagErrorHandler } from '@bugsnag/plugin-angular';
import { FamilyComponent } from './family/family.component';

// configure Bugsnag asap
Bugsnag.start({ apiKey: '8783f99df54186794b7bf3ccb7954947' });

// create a factory which will return the Bugsnag error handler
export function errorHandlerFactory() {
    return new BugsnagErrorHandler()
  }

@NgModule({
    declarations: [AppComponent, FamilyComponent],
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
        BrowserAnimationsModule,
        RouterModule.forRoot([
            {
                path: '',
                loadChildren: () => import('./home/home.module').then((m) => m.HomeModule),
            },
            {
                path: 'types',
                loadChildren: () => import('./types/types.module').then((m) => m.TypesModule),
            },
            {path:'family',component:FamilyComponent},
        ]),
        MatMenuModule,
    ],
    providers: [{ provide: ErrorHandler, useFactory: errorHandlerFactory }],
    bootstrap: [AppComponent],
})
export class AppModule {}
