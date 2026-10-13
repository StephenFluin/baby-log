import { Component, effect, inject, input } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Dialogs } from '../dialogs';
import { Activity, Event, UserData } from '../user-data.service';
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
    private dialogs = inject(Dialogs);

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

    setDetails(day: { value: Event; key: string }, activity: Activity, details: string) {
        activity.activityDetails = details;
        this.userData.saveEvent(day.key, day.value);
    }

    async note(day: { value: Event; key: string }, activityIndex: number) {
        const activity = day.value.activities[activityIndex];
        const result = await this.dialogs.prompt(`Notes for ${activity.activity}`, activity.notes);
        if (result !== null) {
            activity.notes = result;
            this.userData.saveEvent(day.key, day.value);
        }
    }

    async deleteDay(key: string, date: string) {
        if (await this.dialogs.confirm(`Delete everything logged on ${date}?`, 'Delete')) {
            this.userData.deleteEvent(key);
        }
    }

    async deleteActivity(day: { value: Event; key: string }, activityIndex: number) {
        const activity = day.value.activities[activityIndex];
        if (await this.dialogs.confirm(`Delete this ${activity.activity} entry?`, 'Delete')) {
            this.userData.deleteActivity(day.key, day.value, activityIndex);
        }
    }

    addName(name: string) {
        this.userData.nameChild(name);
    }
}
