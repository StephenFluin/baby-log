import { Component, inject, Injectable } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';

interface ConfirmData {
    message: string;
    action: string;
}

@Component({
    template: `
        <mat-dialog-content>
            <p>{{ data.message }}</p>
        </mat-dialog-content>
        <mat-dialog-actions align="end">
            <button type="button" [mat-dialog-close]="false">Cancel</button>
            <button type="button" [mat-dialog-close]="true" cdkFocusInitial>{{ data.action }}</button>
        </mat-dialog-actions>
    `,
    imports: [MatDialogModule],
})
export class ConfirmDialog {
    data: ConfirmData = inject(MAT_DIALOG_DATA);
}

interface PromptData {
    label: string;
    value: string;
}

@Component({
    template: `
        <form (submit)="$event.preventDefault(); ref.close(input.value)">
            <mat-dialog-content>
                <label for="prompt-input">{{ data.label }}</label>
                <textarea id="prompt-input" #input rows="3" cdkFocusInitial [value]="data.value"></textarea>
            </mat-dialog-content>
            <mat-dialog-actions align="end">
                <button type="button" [mat-dialog-close]="null">Cancel</button>
                <button type="submit">Save</button>
            </mat-dialog-actions>
        </form>
    `,
    styles: `
        label {
            display: block;
            margin-bottom: 8px;
        }
        textarea {
            width: 100%;
            min-width: 280px;
            font: inherit;
        }
    `,
    imports: [MatDialogModule],
})
export class PromptDialog {
    data: PromptData = inject(MAT_DIALOG_DATA);
    ref: MatDialogRef<PromptDialog, string | null> = inject(MatDialogRef);
}

/** Accessible replacements for window.confirm() and window.prompt() */
@Injectable({ providedIn: 'root' })
export class Dialogs {
    private dialog = inject(MatDialog);

    async confirm(message: string, action = 'OK'): Promise<boolean> {
        const ref = this.dialog.open<ConfirmDialog, ConfirmData, boolean>(ConfirmDialog, {
            data: { message, action },
        });
        return (await firstValueFrom(ref.afterClosed())) ?? false;
    }

    async prompt(label: string, value = ''): Promise<string | null> {
        const ref = this.dialog.open<PromptDialog, PromptData, string | null>(PromptDialog, {
            data: { label, value },
        });
        return (await firstValueFrom(ref.afterClosed())) ?? null;
    }
}
