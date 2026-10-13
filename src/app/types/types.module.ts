import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ManageTypes } from './manage-types';

@NgModule({
    declarations: [ManageTypes],
    imports: [
        CommonModule,
        RouterModule.forChild([{ path: '', component: ManageTypes }]),
    ],
})
export class TypesModule {}
