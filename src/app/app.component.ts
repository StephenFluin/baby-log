import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { Auth } from './auth.service';
import { BUILD_DATE } from './build-info';
import { ConnectedFamily, UserData } from './user-data.service';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    imports: [
        RouterLink,
        MatMenuTrigger,
        MatMenu,
        MatMenuItem,
        RouterOutlet,
        DatePipe,
    ],
})
export class AppComponent {
    auth = inject(Auth);
    userData = inject(UserData);
    private router = inject(Router);
    buildDate = BUILD_DATE;

    switchTo(child: ConnectedFamily) {
        // Use a URL instead of switching directly
        this.router.navigate(['child', child.id, child.name]);
    }
    showHistoryOf(child: ConnectedFamily) {
        // Use a URL instead of switching directly
        this.router.navigate(['child', child.id, child.name, 'history']);
    }
}
