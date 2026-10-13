import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ConnectedFamily, UserData } from '../user-data.service';

@Component({
    selector: 'app-family',
    template: `
        <div class="main">
            <h2>Manage Family</h2>
            <p>Name</p>
            <table style="max-width: 500px;">
                @for (child of userData.connectedFamilies(); track child.id) {
                    <tr>
                        <td>
                            <input
                                type="text"
                                [value]="child.name"
                                (change)="userData.renameChild(child, nameInput.value)"
                                #nameInput
                            />
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
                }
            </table>
            <p></p>

            @if (!showNew()) {
                <button (click)="showNew.set(true)">New</button>
            } @else {
                <form (submit)="$event.preventDefault(); create(nameInput.value, codeInput?.value)">
                    <h3>New</h3>
                    <table>
                        <tr>
                            <td>Child's Name</td>
                            <td><input type="text" placeholder="Stephen" #nameInput /></td>
                        </tr>
                        @if (!showCode()) {
                            <tr>
                                <td>Shared Child</td>
                                <td><input type="checkbox" (change)="showCode.set(true)" /></td>
                            </tr>
                        } @else {
                            <tr>
                                <td>Shared Child Code</td>
                                <td><input type="text" #codeInput /></td>
                                <td colspan="2">
                                    Were you given a code from the bottom of an existing child? Feel
                                    free to leave blank to create a new child.
                                </td>
                            </tr>
                        }
                    </table>
                    <button type="submit">Create</button>
                </form>
            }
        </div>
    `,
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false,
})
export class FamilyComponent {
    userData = inject(UserData);

    showNew = signal(false);
    showCode = signal(false);

    create(name: string, code?: string) {
        this.userData.connectNewFamily(code, name);
    }
    delete(child: ConnectedFamily) {
        if (
            confirm(
                `Are you sure you want to detach from this child? You can reconnect if you still have the child's code.`
            )
        ) {
            this.userData.detachChild(child);
        }
    }
}
