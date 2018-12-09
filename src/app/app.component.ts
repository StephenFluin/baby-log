import { Component } from '@angular/core';
import { Auth } from './auth.service';
import { UserData } from './user-data.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
})
export class AppComponent {
    title = 'baby-log';
    activityTypes = {
        'feed': [
            'left',
            'right',
            'bottle'
        ],
        'awake': [
        ],
        'asleep': [
            'chair',
            'bassinet',
            'dockatot',
            'lap',
            'arms'
        ],
        'burping': [
        ],
        'diaper': [
        ],
        'bathing': [
            'sponge',
            'bath',
        ],
    };
    constructor(public auth: Auth, public userData: UserData) {}
}
