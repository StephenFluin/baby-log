import { Component, inject, signal } from '@angular/core';
import { Auth } from '../auth.service';
import { Dialogs } from '../dialogs';
import { ChildOption, Member, UserData } from '../user-data.service';

@Component({
    selector: 'app-family',
    template: `
        <div class="main">
            <h2>Manage Family</h2>
            @for (child of userData.families(); track child.id) {
                <section class="child-card" [attr.aria-label]="child.name">
                    <div class="child-header">
                        <input
                            type="text"
                            [value]="child.named ? child.name : ''"
                            [placeholder]="child.name"
                            [attr.aria-label]="'Name of ' + child.name"
                            (change)="userData.renameChild(child.id, nameInput.value)"
                            #nameInput
                        />
                        <button type="button" (click)="delete(child)">Detach</button>
                    </div>
                    <h3>People with access</h3>
                    <ul>
                        @for (member of userData.familyMembers()[child.id] ?? []; track member.uid) {
                            <li>
                                <span>{{ member.name }}</span>
                                @if (member.uid === auth.uid()) {
                                    <span class="you">(you)</span>
                                } @else {
                                    <button
                                        type="button"
                                        [attr.aria-label]="'Remove ' + member.name + ' from ' + child.name"
                                        (click)="removeMember(child, member)"
                                    >
                                        Remove
                                    </button>
                                }
                            </li>
                        }
                    </ul>
                </section>
            }

            @if (!showNew()) {
                <button type="button" (click)="showNew.set(true)">New child</button>
            } @else {
                <form (submit)="$event.preventDefault(); create(nameInput.value)">
                    <h3>New child</h3>
                    <label for="new-child-name">Child's Name</label>
                    <input id="new-child-name" type="text" placeholder="Stephen" #nameInput />
                    <button type="submit">Create</button>
                </form>
            }
            <p>
                Names are shared with everyone who can see the child's log. To add a child someone else
                is already logging, ask them for an invite link from the bottom of their child's page.
            </p>
        </div>
    `,
    styles: `
        .child-card {
            border: 1px solid #717b94;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 16px;
            max-width: 600px;
        }
        .child-header {
            display: flex;
            gap: 8px;
            align-items: center;
        }
        .child-header input {
            flex: 1;
            height: 36px;
            font-size: 18px;
            padding: 0 8px;
            border-radius: 4px;
        }
        h3 {
            font-size: 16px;
            margin: 16px 0 8px;
        }
        ul {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        li {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 4px 0;
        }
        li span:first-child {
            flex: 1;
        }
        .you {
            opacity: 0.7;
        }
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
    async delete(child: ChildOption) {
        const onlyMember = (this.userData.familyMembers()[child.id]?.length ?? 0) <= 1;
        const message = onlyMember
            ? `You're the only one who can see ${child.name}'s log. If you detach, nobody will be able to see it again.`
            : `Detach ${child.name}? You'll need a new invite from someone else to reconnect.`;
        if (await this.dialogs.confirm(message, 'Detach')) {
            this.userData.detachChild(child);
        }
    }
    async removeMember(child: ChildOption, member: Member) {
        if (await this.dialogs.confirm(`Stop ${member.name} from seeing ${child.name}?`, 'Remove')) {
            this.userData.removeMember(child.id, member.uid);
        }
    }
}
