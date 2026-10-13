import {
    DOCUMENT,
    EnvironmentProviders,
    inject,
    Injectable,
    isDevMode,
    provideEnvironmentInitializer,
} from '@angular/core';
import { ActivatedRouteSnapshot, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

const MEASUREMENT_ID = 'G-MGJD18Z0TW';
const PAGE_TITLE = 'Baby Log';

/** Sends page views to Google Analytics in production builds */
export function provideAnalytics(): EnvironmentProviders {
    return provideEnvironmentInitializer(() => {
        if (!isDevMode()) {
            inject(Analytics).start();
        }
    });
}

/**
 * The route's path with its parameters left as placeholders, e.g. `/child/:code/history`.
 * URLs contain family IDs, invite tokens, and children's names, which must never be sent.
 */
export function routeTemplate(root: ActivatedRouteSnapshot) {
    const segments: string[] = [];
    for (let route: ActivatedRouteSnapshot | null = root; route; route = route.firstChild) {
        if (route.routeConfig?.path) {
            segments.push(route.routeConfig.path);
        }
    }
    return '/' + segments.join('/');
}

@Injectable({ providedIn: 'root' })
export class Analytics {
    private document = inject(DOCUMENT);
    private router = inject(Router);

    start() {
        const window = this.document.defaultView as Window & { dataLayer?: unknown[] };
        window.dataLayer = window.dataLayer || [];
        const gtag: (...args: unknown[]) => void = function () {
            // gtag.js expects the arguments object itself, not an array
            window.dataLayer!.push(arguments);
        };

        const origin = this.document.location.origin;
        // Config parameters apply to every event, so the real URL and the title (which has the
        // child's name) are never sent. Called again on each navigation to update the path.
        const configure = (path: string, referrer: string) =>
            gtag('config', MEASUREMENT_ID, {
                send_page_view: false,
                page_location: origin + path,
                page_title: PAGE_TITLE,
                page_referrer: referrer,
            });
        gtag('js', new Date());
        configure('/', this.externalReferrer());

        const script = this.document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
        this.document.head.appendChild(script);

        this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
            const path = routeTemplate(this.router.routerState.snapshot.root);
            configure(path, '');
            gtag('event', 'page_view', { page_location: origin + path, page_title: PAGE_TITLE });
        });
    }

    private externalReferrer() {
        const referrer = this.document.referrer;
        try {
            return referrer && new URL(referrer).origin !== this.document.location.origin ? referrer : '';
        } catch {
            return '';
        }
    }
}
