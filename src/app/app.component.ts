import { Component } from '@angular/core';
import { Auth } from './auth.service';
import { UserData } from './user-data.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
})
export class AppComponent {
    title = 'baby-log';
    activityTypes = {
        'feed': [
            'left',
            'right',
        ],
        'awake': [
        ],
        'asleep': [
            'chair',
            'bassinet',
            'lap',
        ],
        'burping': [
        ],
        'diaper': [
        ]
    };
    constructor(public auth: Auth, public userData: UserData) {}
}
