import { Component } from '@angular/core';
import { UserData } from '../user-data.service';

@Component({
    selector: 'app-family',
    template: `
        <div class="main">
            <h2>Manage Family</h2>
            <p>Name</p>
            <table style="max-width: 500px;">
                <tr *ngFor="let child of userData.connectedFamilies">
                    <td>
                        <input type="text" [value]="child.name" (input)="update(child, $event)" />
                    </td>
                    <td>
                        <div class="icon-circle">
                            <img
                                (click)="delete(child)"
                                src="../assets/images/baseline-delete_forever-24px.svg"
                                height="24px"
                                width="24px"
                            />
                        </div>
                    </td>
                </tr>
            </table>
            <p></p>

            <button *ngIf="!showNew" (click)="showNew = true">New</button>

            <form *ngIf="showNew" (submit)="new($event)">
                <h3>New</h3>
                <table>
                    <tr>
                        <td>Child's Name</td>
                        <td><input type="text" name="name" placeholder="Stephen" /></td>
                    </tr>

                    <tr *ngIf="!showCode">
                        <td>Shared Child</td>
                        <td><input type="checkbox" (change)="showCode = true" /></td>
                    </tr>

                    <tr *ngIf="showCode">
                        <td>Shared Child Code</td>
                        <td><input type="text" name="code" /></td>
                        <td colspan="2" *ngIf="showCode">
                            Were you given a code from the bottom of an existing child? Feel free to
                            leave blank to create a new child.
                        </td>
                    </tr>
                </table>
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

        this.userData.connectNewFamily(code, name);
    }
    delete(child) {
        if (
            confirm(
                `Are you sure you want to detach from this child? You can reconnect if you still have the child's code.`
            )
        ) {
            const index = this.userData.connectedFamilies.indexOf(child);
            this.userData.connectedFamilies.splice(index);
            this.userData.saveConnectedFamilies();

            // Make sure we don't keep a deleted child selected
            if (this.userData.child === child.name) {
                this.userData.switchToFamilyId(this.userData.connectedFamilies[0].id);
            }
        }
    }
}
