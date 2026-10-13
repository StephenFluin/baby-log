import { Component, inject, signal } from '@angular/core';
import { Auth } from '../auth.service';
import { Dialogs } from '../dialogs';
import { ConnectedFamily, Member, UserData } from '../user-data.service';

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
                <form (submit)="$event.preventDefault(); create(nameInput.value)">
                    <h3>New</h3>
                    <label for="new-child-name">Child's Name</label>
                    <input id="new-child-name" type="text" placeholder="Stephen" #nameInput />
                    <button type="submit">Create</button>
                    <p>
                        To add a child someone else is already logging, ask them for an invite link
                        from the bottom of their child's page.
                    </p>
                </form>
            }

            <h3>People who can see {{ userData.child() || 'this log' }}</h3>
            <ul>
                @for (member of userData.members(); track member.uid) {
                    <li>
                        {{ member.name }}
                        @if (member.uid === auth.uid()) {
                            (you)
                        } @else {
                            <button type="button" (click)="removeMember(member)">Remove</button>
                        }
                    </li>
                }
            </ul>
        </div>
    `,
})
export class FamilyComponent {
    userData = inject(UserData);
    auth = inject(Auth);
    private dialogs = inject(Dialogs);

    showNew = signal(false);

    create(name: string) {
        this.userData.connectNewFamily(null, name);
        this.showNew.set(false);
    }
    async delete(child: ConnectedFamily) {
        const onlyMember = (await this.userData.memberCount(child.id)) <= 1;
        const message = onlyMember
            ? `You're the only one who can see ${child.name}'s log. If you detach, nobody will be able to see it again.`
            : `Detach ${child.name}? You'll need a new invite from someone else to reconnect.`;
        if (await this.dialogs.confirm(message, 'Detach')) {
            this.userData.detachChild(child);
        }
    }
    async removeMember(member: Member) {
        const child = this.userData.child() || 'this log';
        if (await this.dialogs.confirm(`Stop ${member.name} from seeing ${child}?`, 'Remove')) {
            this.userData.removeMember(member.uid);
        }
    }
}
