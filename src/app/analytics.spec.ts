import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { routeTemplate } from './analytics';
import { routes } from './app.routes';

@Component({ template: '' })
class Empty {}

describe('routeTemplate', () => {
    // Same paths as the app, without loading the real components
    const testRoutes = routes.map((route) => ({
        ...route,
        loadComponent: undefined,
        component: route.children ? undefined : Empty,
        children: route.children?.map((child) => ({ ...child, loadComponent: undefined, component: Empty })),
    }));

    async function templateFor(url: string) {
        TestBed.configureTestingModule({ providers: [provideRouter(testRoutes)] });
        const router = TestBed.inject(Router);
        await router.navigateByUrl(url);
        return routeTemplate(router.routerState.snapshot.root);
    }

    it('replaces family IDs and names with placeholders', async () => {
        expect(await templateFor('/child/-Pfamily123/Ada/history')).toBe('/child/:code/:name/history');
    });

    it('never includes invite tokens', async () => {
        expect(await templateFor('/attach/secret-invite-token-1234567890')).toBe('/attach/:invite');
    });

    it('reports the home page as /', async () => {
        expect(await templateFor('/')).toBe('/');
    });
});
