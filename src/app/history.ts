import { Component, OnDestroy } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Auth } from './auth.service';
import { UserData } from './user-data.service';

@Component({
    selector: 'app-history',
    templateUrl: './history.html',
})
export class History implements OnDestroy {
    destroy = new Subject();

    constructor(public auth: Auth, public userData: UserData, title: Title, route: ActivatedRoute)  {
        route.paramMap.pipe(takeUntil(this.destroy)).subscribe((paramMap) => {
            if (paramMap.get('code')) {
                userData.switchToFamilyId(route.snapshot.params['code']);
            }
        });

        // Can't do this until the service is setup
        userData.eventSource.pipe(takeUntil(this.destroy)).subscribe((source) => {
            title.setTitle(userData.child + ' Baby Log');
        });
    }
    ngOnDestroy() {
        this.destroy.next();
    }
}
