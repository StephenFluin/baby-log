import { Component, effect, inject, input, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Event, UserData } from './user-data.service';
import { ShareFooter } from './share-footer';

@Component({
    selector: 'app-history',
    templateUrl: './history.html',
    imports: [ShareFooter],
})
export class History {
    userData = inject(UserData);

    /** Family ID from the route */
    code = input<string>();
    events = signal<Event[] | null>(null);

    constructor() {
        const title = inject(Title);
        effect(() => {
            const code = this.code();
            if (code) {
                this.userData.switchToFamilyId(code);
            }
        });
        effect(() => title.setTitle(`${this.userData.child() || ''} Baby Log`.trim()));
        effect((onCleanup) => {
            const familyId = this.userData.familyId();
            if (familyId) {
                onCleanup(this.userData.watchHistory(familyId, (events) => this.events.set(events)));
            }
        });
    }
}
