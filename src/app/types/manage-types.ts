import { Component, OnDestroy } from '@angular/core';
import { UserData } from '../user-data.service';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { AngularFireDatabase } from '@angular/fire/database';

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
        userData.typeList.pipe(takeUntil(this.cleanup)).subscribe((types) => {
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
    updateDetails(typeId: string, details: string[], newDetailBox) {
        if (!details) {
            details = [];
        }
        details.push(newDetailBox.value);
        this.userData.updateTypeDetail(typeId, details);
    }
    deleteDetail(typeId: string, details: string[], detailName: string) {
        const index = details.indexOf(detailName);
        if (index !== -1) {
            details.splice(index, 1);
            this.userData.updateTypeDetail(typeId, details);
        }
    }
    addType(newType) {
        const type = newType.value;
        console.log(type);
        this.userData.types.push({ name: type, details: [] });
        newType.value = '';
    }
    deleteType(typeId: string) {
        this.userData.types.remove(typeId);
    }
}
