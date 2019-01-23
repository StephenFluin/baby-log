import { Component, OnDestroy } from '@angular/core';
import { UserData } from './user-data.service';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { Type } from './user-data.service';

export const DEFAULT_TYPES = {
    feed: ['left', 'right', 'bottle'],
    awake: [],
    asleep: ['chair', 'bassinet', 'dockatot', 'lap', 'arms'],
    burping: [],
    diaper: [],
    bathing: ['sponge', 'bath'],
};

@Component({
    selector: 'app-manage-types',
    templateUrl: 'manage-types.html',
})
export class ManageTypes implements OnDestroy {
    cleanup = new Subject();

    constructor(public userData: UserData) {
        userData.typeList.pipe(takeUntil(this.cleanup)).subscribe(types => {
            if (types.length === 0) {
                // No types found, let's insert the defaults
                for (const key of Object.keys(DEFAULT_TYPES)) {
                    this.userData.types.push({ name: key, details: DEFAULT_TYPES[key] });
                }
            }
        });
    }
    ngOnDestroy() {
        this.cleanup.next();
    }
}
