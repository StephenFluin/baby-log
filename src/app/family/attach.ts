import { Component } from '@angular/core';
import { UserData } from '../user-data.service';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Observable } from 'rxjs';
@Component({
    template: `
        <div class="main">
            <h2>Manage Family</h2>
            <p>You've been invited to add a child to your account.</p>
            <ng-container *ngIf="data | async as data">
                <p>Name:{{ data.name }}</p>
                <p>Code: {{ data.code }}</p>
                <button (click)="attach(data.name, data.code)">Attach</button>
            </ng-container>
        </div>
    `,
})
export class AttachComponent {
    data:Observable<Params>;
    constructor(
        public userData: UserData,
        public activatedRoute: ActivatedRoute,
        private router: Router
    ) {
        // Figure out who they are attaching to, attach, and tell them we did it!
        this.data = this.activatedRoute.params;
    }
    attach(name, code) {
        console.log('about to attach');
        this.userData.connectNewFamily(code, name);
        console.log('attached');
        this.router.navigate(['']);
        console.log('navigated after attaching');
    }
}
