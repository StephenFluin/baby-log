import { Routes } from '@angular/router';
import { AttachComponent } from './family/attach';
import { FamilyComponent } from './family/family.component';

const loadHome = () => import('./home/home').then((m) => m.Home);
const loadHistory = () => import('./history').then((m) => m.History);

/** Routes for viewing a child's log, with the family ID as the code */
const childRoutes: Routes = [
    { path: '', loadComponent: loadHome, pathMatch: 'full' },
    { path: ':code/:name/history', loadComponent: loadHistory },
    { path: ':code/history', loadComponent: loadHistory },
    { path: ':code/:name', loadComponent: loadHome },
    { path: ':code', loadComponent: loadHome },
];

export const routes: Routes = [
    { path: '', loadComponent: loadHome, pathMatch: 'full' },
    { path: 'child', children: childRoutes },
    { path: 'history', children: childRoutes },
    {
        path: 'types',
        loadComponent: () => import('./types/manage-types').then((m) => m.ManageTypes),
    },
    { path: 'family', component: FamilyComponent },
    { path: 'attach/:invite', component: AttachComponent },
    // Links from before invites existed
    { path: 'attach/:code/:name', component: AttachComponent, data: { legacy: true } },
];
