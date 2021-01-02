import { Component } from '@angular/core';
import { Auth } from './auth.service';
import { UserData } from './user-data.service';
import { NgxMaterialTimepickerTheme } from 'ngx-material-timepicker';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
})
export class AppComponent {
    constructor(public auth: Auth, public userData: UserData) {}
    switchTo(child: {id:string,name:string}) {
        this.userData.switchToFamilyId(child.id);
    }
}
