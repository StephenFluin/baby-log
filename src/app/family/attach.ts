import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { UserData } from '../user-data.service';

@Component({
    template: `
        <div class="main">
            <h2>Manage Family</h2>
            <p>You've been invited to add a child to your account.</p>
            <p>Name:{{ name() }}</p>
            <p>Code: {{ code() }}</p>
            <button (click)="attach()">Attach</button>
        </div>
    `,
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false,
})
export class AttachComponent {
    private userData = inject(UserData);
    private router = inject(Router);

    /** Who they are attaching to, from the route */
    code = input.required<string>();
    name = input.required<string>();

    attach() {
        this.userData.connectNewFamily(this.code(), this.name());
        this.router.navigate(['']);
    }
}
