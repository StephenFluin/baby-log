import { BrowserModule } from '@angular/platform-browser';
import { NgModule, ErrorHandler } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppComponent } from './app.component';
import { AngularFireModule } from '@angular/fire/compat';
import { AngularFireAuthModule } from '@angular/fire/compat/auth';
import { RouterModule } from '@angular/router';
import { MatMenuModule } from '@angular/material/menu';
import { AngularFireDatabaseModule } from '@angular/fire/compat/database';
import { FamilyComponent } from './family/family.component';
import { AttachComponent } from './family/attach';
import { History } from './history';

@NgModule({
    declarations: [AppComponent, FamilyComponent, AttachComponent],
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
                pathMatch: 'full',
            },
            {
                path: 'child',
                loadChildren: () => import('./home/home.module').then((m) => m.HomeModule),
            },
            {
                path: 'types',
                loadChildren: () => import('./types/types.module').then((m) => m.TypesModule),
            },
            {
                path: 'history',
                loadChildren: () => import('./home/home.module').then((m) => m.HomeModule),
            },
            { path: 'family', component: FamilyComponent },
            { path: 'attach/:code/:name', component: AttachComponent },
        ]),
        MatMenuModule,
    ],
    bootstrap: [AppComponent],
})
export class AppModule {}
