import { Component } from '@angular/core';
import { UserData } from '../user-data.service';
import { ActivatedRoute } from '@angular/router';
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
    data = this.activatedRoute.params;
    constructor(public userData: UserData, public activatedRoute: ActivatedRoute) {
        // Figure out who they are attaching to, attach, and tell them we did it!
    }
    attach(name, code) {
        this.userData.connectNewFamily(code, name);
    }
}
