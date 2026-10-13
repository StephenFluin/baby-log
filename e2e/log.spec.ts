import { expect, test } from '@playwright/test';
import { confirmDialog, openMenu, signIn } from './helpers';

test('logs a day of activities', async ({ page }) => {
    await signIn(page, 'Logger');
    await expect(page.getByText('We created this log for you')).toBeVisible();

    // Name the baby (stored only on this device)
    await page.getByLabel("Baby's name").fill('Ada');
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByRole('heading', { name: 'Ada', level: 1 })).toBeVisible();
    await expect(page).toHaveTitle('Ada Baby Log');

    // Visiting Manage Types fills in the default types
    await openMenu(page, 'Manage Types');
    await expect(page.getByRole('heading', { name: 'asleep' })).toBeVisible();
    await page.getByLabel('New diaper detail:').fill('wet');
    await page.getByLabel('New diaper detail:').press('Enter');
    await expect(page.getByText('wet')).toBeVisible();
    await page.getByRole('link', { name: 'Baby Log' }).click();

    // Start a day and log some activities
    await page.getByRole('button', { name: 'Create New Day' }).click();
    await page.getByRole('button', { name: 'asleep', exact: true }).click();
    await page.getByRole('button', { name: 'diaper', exact: true }).click();
    await expect(page.getByLabel('Time of diaper')).toBeVisible();

    await page.getByLabel('Details for asleep').selectOption('bassinet');
    await expect(page.getByLabel('Details for asleep')).toHaveValue('bassinet');

    await page.getByRole('button', { name: 'Notes for asleep' }).click();
    await page.getByRole('dialog').getByLabel('Notes for asleep').fill('Went down easily');
    await page.getByRole('dialog').getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Went down easily')).toBeVisible();

    // Move the diaper change to the afternoon with the time picker
    const time = page.getByLabel('Time of diaper');
    const before = await time.inputValue();
    await time.click();
    await page.getByRole('button', { name: before.endsWith('AM') ? 'PM' : 'AM' }).click();
    await page.getByRole('button', { name: 'OK' }).click();
    await expect(time).not.toHaveValue(before);

    await page.getByRole('button', { name: 'Delete diaper' }).click();
    await confirmDialog(page, 'Delete');
    await expect(page.getByLabel('Time of diaper')).toHaveCount(0);

    // Everything shows up in the history
    await openMenu(page, 'History', 'Ada');
    await expect(page.getByRole('heading', { name: 'Ada History' })).toBeVisible();
    await expect(page.getByText('Went down easily')).toBeVisible();
});
