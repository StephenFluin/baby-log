import { BrowserModule } from '@angular/platform-browser';
import { NgModule, ErrorHandler } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppComponent } from './app.component';
import { RouterModule } from '@angular/router';
import { MatMenuModule } from '@angular/material/menu';
import { FamilyComponent } from './family/family.component';
import { AttachComponent } from './family/attach';
import { History } from './history';

@NgModule({
    declarations: [AppComponent, FamilyComponent, AttachComponent],
    imports: [
        BrowserModule,
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
        ], { bindToComponentInputs: true }),
        MatMenuModule,
    ],
    bootstrap: [AppComponent],
})
export class AppModule {}
