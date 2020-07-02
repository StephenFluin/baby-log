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
    connectNewFamily() {
        const name = prompt('What name should we use?');
        const id = prompt(
            'Do you have an ID for an existing child? Leave blank to create a new child.'
        );
        this.userData.connectNewFamily(id, name);
    }
}
