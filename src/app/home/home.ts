import { Component, effect, inject, input } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Event, UserData } from '../user-data.service';
import { RouterLink } from '@angular/router';
import { NgxMatTimepickerDirective, NgxMatTimepickerComponent } from 'ngx-mat-timepicker';
import { ShareFooter } from '../share-footer';
import { SummarizeEventPipe } from './summarize-event.pipe';

@Component({
    selector: 'app-home',
    templateUrl: './home.html',
    imports: [
        RouterLink,
        NgxMatTimepickerDirective,
        NgxMatTimepickerComponent,
        ShareFooter,
        SummarizeEventPipe,
    ],
})
export class Home {
    userData = inject(UserData);

    /** Family ID from the route */
    code = input<string>();

    editableDateMode = false;

    constructor() {
        const title = inject(Title);
        effect(() => {
            const code = this.code();
            if (code) {
                this.userData.switchToFamilyId(code);
            }
        });
        effect(() => title.setTitle(`${this.userData.child() || ''} Baby Log`.trim()));
    }

    setDetails(day: { value: Event; key: string }, activity: Event['activities'][number], details: string) {
        activity.activityDetails = details;
        this.userData.saveEvent(day.key, day.value);
    }

    note(day: { value: Event; key: string }, activityIndex: number) {
        let result;
        if (!day.value.activities[activityIndex].notes) {
            result = prompt('Add details to this activity');
        } else {
            result = prompt('Replace the notes for this activity');
        }
        if (result) {
            day.value.activities[activityIndex].notes = result;
        }
        this.userData.saveEvent(day.key, day.value);
    }

    addName(name: string) {
        this.userData.nameChild(name);
    }
}
