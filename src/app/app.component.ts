import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from './auth.service';
import { ConnectedFamily, UserData } from './user-data.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    standalone: false,
})
export class AppComponent {
    auth = inject(Auth);
    userData = inject(UserData);
    private router = inject(Router);

    switchTo(child: ConnectedFamily) {
        // Use a URL instead of switching directly
        this.router.navigate(['child', child.id, child.name]);
    }
    showHistoryOf(child: ConnectedFamily) {
        // Use a URL instead of switching directly
        this.router.navigate(['child', child.id, child.name, 'history']);
    }
}
