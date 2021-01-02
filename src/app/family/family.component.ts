import { Component } from '@angular/core';
import { UserData } from '../user-data.service';

@Component({
    selector: 'app-family',
    template: `
    <style>label {display:block;}</style>
        <div class="main">
            <h2>Manage Family</h2>
            <p>Name</p>
            <div *ngFor="let child of userData.connectedFamilies">
                <input type="text" [value]="child.name" (input)="update(child, $event)" /> (x)
            </div>
            <p></p>

            <button *ngIf="!showNew" (click)="showNew = true">New</button>

            <form *ngIf="showNew" (submit)="new($event)">
                <h3>New</h3>
                <label>Child's Name <input type="text" name="name" placeholder="Stephen"/></label>
                <label *ngIf="!showCode">Shared Child <input type="checkbox" (change)="showCode = true"></label>
                <label *ngIf="showCode">Shared Child Code <input type="text" name="code" /></label>
                <p *ngIf="showCode">Were you given a code from the bottom of an existing child? Feel free to leave blank to create a new child.</p>
                <button type="submit">Create</button>
            </form>
        </div>
    `,
    styles: [],
})
export class FamilyComponent {
    showNew = false;
    showCode = false;
    constructor(public userData: UserData) {}
    update(child, event) {
        console.log(child, event.target.value);
        child.name = event.target.value;
        this.userData.saveConnectedFamilies();
        // this.userData.connectedFamilies[this.userData.connectedFamilies.indexOf(child)]
    }
    new(event) {
        event.preventDefault();
        const name = event.target.name.value;
        const code = event.target.code.value;

        this.userData.connectNewFamily(code,name);
    }
}
