import { Component, computed, inject, input, resource, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Invite, UserData } from '../user-data.service';

@Component({
    template: `
        <div class="main">
            @if (!problem() && invite.value(); as details) {
                <h2>Add {{ childName() }}</h2>
                <p>You've been invited to add {{ childName() }} to your account.</p>
                <button type="button" [disabled]="working()" (click)="attach(details)">
                    Add {{ childName() }}
                </button>
            }
            @if (problem(); as problem) {
                <h2>Invite not available</h2>
                <p role="alert">{{ problem }} Ask whoever sent it for a new invite.</p>
            }
        </div>
    `,
})
export class AttachComponent {
    private userData = inject(UserData);
    private router = inject(Router);

    /** The invite token from the link */
    token = input<string>(undefined, { alias: 'invite' });
    /** Set for links from before invites existed */
    legacy = input(false);

    invite = resource({
        params: () => this.token(),
        loader: ({ params }) => this.userData.getInvite(params),
    });
    childName = computed(() => this.invite.value()?.childName || 'a child');

    working = signal(false);
    private error = signal<string | null>(null);
    problem = computed(() => {
        if (this.legacy()) {
            return 'This link is from an older version of Baby Log and no longer works.';
        }
        if (this.error()) {
            return this.error();
        }
        if (this.invite.isLoading()) {
            return null;
        }
        const invite = this.invite.value();
        if (!invite || invite.expires < Date.now()) {
            return 'This invite has expired or was already used.';
        }
        return null;
    });

    async attach(details: Invite) {
        this.working.set(true);
        try {
            await this.userData.acceptInvite(this.token()!, details);
            this.router.navigate(['']);
        } catch {
            this.error.set('This invite has expired or was already used.');
        } finally {
            this.working.set(false);
        }
    }
}
