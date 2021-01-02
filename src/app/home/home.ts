import { Component } from '@angular/core';
import { NgxMaterialTimepickerTheme } from 'ngx-material-timepicker';
import { Auth } from '../auth.service';
import { UserData } from '../user-data.service';
import { Event } from '../user-data.service';
import { Title } from '@angular/platform-browser';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-home',
    templateUrl: './home.html',
})
export class Home {
    darkTheme: NgxMaterialTimepickerTheme = {
        container: {
            bodyBackgroundColor: '#424242',
            buttonColor: '#fff',
        },
        dial: {
            dialBackgroundColor: '#555',
        },
        clockFace: {
            clockFaceBackgroundColor: '#555',
            clockHandColor: '#9fbd90',
            clockFaceTimeInactiveColor: '#fff',
        },
    };

    editableDateMode = false;

    destroy = new Subject();

    constructor(public auth: Auth, public userData: UserData, title: Title, route: ActivatedRoute) {
        route.paramMap.pipe(takeUntil(this.destroy)).subscribe(paramMap => {
            if(paramMap.get('code')) {
                userData.switchToFamilyId(route.snapshot.params['code']);
            }
        })


        // Can't do this until the service is setup
        userData.eventSource.pipe(takeUntil(this.destroy)).subscribe((source) => {
            title.setTitle(userData.child + ' Baby Log');
        });
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
    ngOnDestroy() {
        this.destroy.next();
    }
}
