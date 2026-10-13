import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Auth } from './auth.service';
import { ConnectedFamily, UserData } from './user-data.service';

declare var ga: any;

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false,
})
export class AppComponent {
    auth = inject(Auth);
    userData = inject(UserData);
    private router = inject(Router);

    constructor() {
        this.router.events
            .pipe(filter((e) => e instanceof NavigationEnd))
            .subscribe((n: NavigationEnd) => {
                ga('send', 'pageview', n.urlAfterRedirects);
            });
    }
    switchTo(child: ConnectedFamily) {
        // Use a URL instead of switching directly
        this.router.navigate(['child', child.id, child.name]);
    }
    showHistoryOf(child: ConnectedFamily) {
        // Use a URL instead of switching directly
        this.router.navigate(['child', child.id, child.name, 'history']);
    }
}
