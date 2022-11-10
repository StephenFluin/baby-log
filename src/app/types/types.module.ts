import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ManageTypes } from './manage-types';
import { AngularFireDatabaseModule } from '@angular/fire/compat/database';

@NgModule({
    declarations: [ManageTypes],
    imports: [
        CommonModule,
        RouterModule.forChild([{ path: '', component: ManageTypes }]),
    ],
})
export class TypesModule {}
