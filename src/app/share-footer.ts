import { Component, effect, inject, signal } from '@angular/core';
import { UserData } from './user-data.service';

@Component({
    selector: 'app-share-footer',
    template: `
        <section class="main share-footer" aria-labelledby="share-heading">
            <h2 id="share-heading">Share {{ userData.child() || 'this log' }}</h2>
            @if (inviteLink(); as link) {
                <label for="invite-link">Invite link (works once, for 7 days):</label>
                <input id="invite-link" type="text" readonly [value]="link" (focus)="selectLink($event)" />
                <button type="button" (click)="email(link)">Email the invite</button>
            } @else {
                <p>Invite someone else to see and add to this log.</p>
                <button type="button" (click)="createInvite()">Create invite link</button>
            }
            @if (error()) {
                <p role="alert">{{ error() }}</p>
            }
        </section>
    `,
    styles: `
        .share-footer {
            margin-top: 250px;
        }
        #invite-link {
            width: 100%;
            max-width: 500px;
            margin: 8px 0;
        }
    `,
})
export class ShareFooter {
    userData = inject(UserData);

    inviteLink = signal<string | null>(null);
    error = signal<string | null>(null);

    constructor() {
        // An invite is for one family, so start over when switching children
        effect(() => {
            this.userData.familyId();
            this.inviteLink.set(null);
            this.error.set(null);
        });
    }

    async createInvite() {
        this.error.set(null);
        try {
            this.inviteLink.set(await this.userData.createInvite());
        } catch {
            this.error.set("Couldn't create an invite. Please try again.");
        }
    }

    email(link: string) {
        const child = this.userData.child() || 'our baby';
        const subject = `Baby Log: Add ${child} to your account`;
        const body = `Here is the link to add ${child} to your Baby Log account. It works once, for 7 days:\r\n\r\n${link}`;
        // Navigate rather than render a mailto: link so the invite never appears in a link's href
        location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    }

    selectLink(event: FocusEvent) {
        (event.target as HTMLInputElement).select();
    }
}
