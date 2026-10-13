import { Component, effect, inject } from '@angular/core';
import { UserData } from '../user-data.service';

export const DEFAULT_TYPES: Record<string, string[]> = {
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
export class ManageTypes {
    userData = inject(UserData);

    constructor() {
        effect(() => {
            if (this.userData.typesLoaded() && this.userData.types()?.length === 0) {
                // No types found, let's insert the defaults
                for (const key of Object.keys(DEFAULT_TYPES)) {
                    this.userData.addType({ name: key, details: DEFAULT_TYPES[key] });
                }
            }
        });
    }
    updateDetails(typeId: string, details: string[] | undefined, newDetailBox: HTMLInputElement) {
        this.userData.updateTypeDetail(typeId, [...(details || []), newDetailBox.value]);
        newDetailBox.value = '';
    }
    deleteDetail(typeId: string, details: string[] = [], detailName: string) {
        this.userData.updateTypeDetail(
            typeId,
            details.filter((detail) => detail !== detailName)
        );
    }
    addType(newType: HTMLInputElement) {
        this.userData.addType({ name: newType.value, details: [] });
        newType.value = '';
    }
    deleteType(typeId: string) {
        this.userData.removeType(typeId);
    }
}
