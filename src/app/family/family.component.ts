import { Component, inject, signal } from '@angular/core';
import { Dialogs } from '../dialogs';
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
                                [attr.aria-label]="'Name of ' + child.name"
                                (change)="userData.renameChild(child, nameInput.value)"
                                #nameInput
                            />
                        </td>
                        <td>
                            <button
                                type="button"
                                class="icon-circle"
                                [attr.aria-label]="'Detach ' + child.name"
                                (click)="delete(child)"
                            >
                                <img src="../assets/images/baseline-delete_forever-24px.svg" alt="" />
                            </button>
                        </td>
                    </tr>
                }
            </table>
            <p></p>

            @if (!showNew()) {
                <button type="button" (click)="showNew.set(true)">New</button>
            } @else {
                <form (submit)="$event.preventDefault(); create(nameInput.value, code())">
                    <h3>New</h3>
                    <table>
                        <tr>
                            <td><label for="new-child-name">Child's Name</label></td>
                            <td><input id="new-child-name" type="text" placeholder="Stephen" #nameInput /></td>
                        </tr>
                        @if (!showCode()) {
                            <tr>
                                <td><label for="shared-child">Shared Child</label></td>
                                <td><input id="shared-child" type="checkbox" (change)="showCode.set(true)" /></td>
                            </tr>
                        } @else {
                            <tr>
                                <td><label for="shared-child-code">Shared Child Code</label></td>
                                <td>
                                    <input
                                        id="shared-child-code"
                                        type="text"
                                        (input)="code.set(codeInput.value)"
                                        #codeInput
                                    />
                                </td>
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
})
export class FamilyComponent {
    userData = inject(UserData);
    private dialogs = inject(Dialogs);

    showNew = signal(false);
    showCode = signal(false);
    /** Family ID of an existing child to attach to */
    code = signal('');

    create(name: string, code: string) {
        this.userData.connectNewFamily(code, name);
    }
    async delete(child: ConnectedFamily) {
        if (
            await this.dialogs.confirm(
                `Detach ${child.name}? You can reconnect if you still have the child's code.`,
                'Detach'
            )
        ) {
            this.userData.detachChild(child);
        }
    }
}
