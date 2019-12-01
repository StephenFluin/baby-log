import { Component } from '@angular/core';
import { Auth } from './auth.service';
import { UserData } from './user-data.service';
import { NgxMaterialTimepickerTheme } from 'ngx-material-timepicker';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
})
export class AppComponent {
    title = 'baby-log';
    darkTheme: NgxMaterialTimepickerTheme = {
        container: {
            bodyBackgroundColor: '#424242',
            buttonColor: '#fff'
        },
        dial: {
            dialBackgroundColor: '#555',
        },
        clockFace: {
            clockFaceBackgroundColor: '#555',
            clockHandColor: '#9fbd90',
            clockFaceTimeInactiveColor: '#fff'
        }
    };

    constructor(public auth: Auth, public userData: UserData) {}
}
