import { Component, effect, inject, signal } from '@angular/core';
import { Role, UserData } from './user-data.service';

@Component({
    selector: 'app-share-footer',
    template: `
        <section class="main share-footer" aria-labelledby="share-heading">
            <h2 id="share-heading">Share {{ userData.child() || 'this log' }}</h2>
            @if (inviteLink(); as link) {
                <label for="invite-link">Invite link (works once, for 7 days):</label>
                <input id="invite-link" type="text" readonly [value]="link" (focus)="selectLink($event)" />
                <div class="invite-actions">
                    <button type="button" (click)="copy(link)">{{ copied() ? 'Copied!' : 'Copy link' }}</button>
                    @if (canShare) {
                        <button type="button" (click)="share(link)">Share…</button>
                    }
                    <a [href]="mailto(link)">Email the invite</a>
                </div>
            } @else if (userData.canManage()) {
                <p>Invite someone else to see and add to this log.</p>
                <fieldset>
                    <legend>They'll be a</legend>
                    <label>
                        <input type="radio" name="invite-role" value="caregiver" [checked]="role() === 'caregiver'" (change)="role.set('caregiver')" />
                        Caregiver: can see and add to the log
                    </label>
                    <label>
                        <input type="radio" name="invite-role" value="manager" [checked]="role() === 'manager'" (change)="role.set('manager')" />
                        Manager: can also invite and remove people
                    </label>
                </fieldset>
                <button type="button" (click)="createInvite()">Create invite link</button>
            } @else {
                <p>Ask a manager of this log if you'd like to invite someone else.</p>
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
        fieldset {
            border: none;
            padding: 0;
            margin: 0 0 12px;
        }
        fieldset label {
            display: block;
            margin: 4px 0;
        }
        #invite-link {
            width: 100%;
            max-width: 500px;
            margin: 8px 0;
        }
        .invite-actions {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 12px;
        }
        .invite-actions a {
            text-decoration: underline;
        }
    `,
})
export class ShareFooter {
    userData = inject(UserData);

    inviteLink = signal<string | null>(null);
    error = signal<string | null>(null);
    copied = signal(false);
    role = signal<Role>('caregiver');
    /** The system share sheet, mostly on phones */
    canShare = typeof navigator.share === 'function';

    constructor() {
        // An invite is for one family, so start over when switching children
        effect(() => {
            this.userData.familyId();
            this.inviteLink.set(null);
            this.error.set(null);
            this.copied.set(false);
            this.role.set('caregiver');
        });
    }

    async createInvite() {
        this.error.set(null);
        try {
            this.inviteLink.set(await this.userData.createInvite(this.role()));
        } catch {
            this.error.set("Couldn't create an invite. Please try again.");
        }
    }

    async copy(link: string) {
        try {
            await navigator.clipboard.writeText(link);
            this.copied.set(true);
        } catch {
            this.error.set("Couldn't copy the link. Select it above and copy it instead.");
        }
    }

    async share(link: string) {
        try {
            await navigator.share({ title: this.subject(), text: this.message(), url: link });
        } catch {
            // Cancelled or unavailable; the other options are still there
        }
    }

    mailto(link: string) {
        return `mailto:?subject=${encodeURIComponent(this.subject())}&body=${encodeURIComponent(
            `${this.message()}\r\n\r\n${link}`
        )}`;
    }

    private subject() {
        return `Baby Log: Add ${this.userData.child() || 'our baby'} to your account`;
    }

    private message() {
        const child = this.userData.child() || 'our baby';
        return `Here is the link to add ${child} to your Baby Log account. It works once, for 7 days.`;
    }

    selectLink(event: FocusEvent) {
        (event.target as HTMLInputElement).select();
    }
}
