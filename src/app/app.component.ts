import { Component } from '@angular/core';
import { Auth } from './auth.service';
import { UserData } from './user-data.service';
import { NgxMaterialTimepickerTheme } from 'ngx-material-timepicker';
import { Router } from '@angular/router';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
})
export class AppComponent {
    constructor(public auth: Auth, public userData: UserData, public router: Router) {}
    switchTo(child: {id:string,name:string}) {
        // Use a URL instead of switching directly
        this.router.navigate(['child',child.id,child.name]);
    }
}
