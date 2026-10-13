import { expect, test } from '@playwright/test';
import { confirmDialog, openMenu, signIn, signOut } from './helpers';

test('adds and detaches children', async ({ page }) => {
    await signIn(page, 'Parent');
    await page.getByLabel("Baby's name").fill('First');
    await page.getByRole('button', { name: 'Save' }).click();

    await openMenu(page, 'Manage Family');
    await page.getByRole('button', { name: 'New' }).click();
    await page.getByLabel("Child's Name").fill('Second');
    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page.getByLabel('Name of Second')).toBeVisible();

    await openMenu(page, 'Switch Child', 'First');
    await expect(page.getByRole('heading', { name: 'First', level: 1 })).toBeVisible();

    await openMenu(page, 'Manage Family');
    await page.getByRole('button', { name: 'Detach Second' }).click();
    await confirmDialog(page, 'Detach');
    await expect(page.getByLabel('Name of Second')).toHaveCount(0);
    await expect(page.getByLabel('Name of First')).toBeVisible();
});

test("doesn't show one account's log to the next account on the same browser", async ({ page }) => {
    await signIn(page, 'Alice');
    await page.getByLabel("Baby's name").fill('Alices Baby');
    await page.getByRole('button', { name: 'Save' }).click();
    await page.getByRole('button', { name: 'Create New Day' }).click();
    await expect(page.locator('.day-container')).toHaveCount(1);
    await signOut(page);

    await signIn(page, 'Bob');
    await expect(page.getByText('We created this log for you')).toBeVisible();
    await expect(page.getByText('Alices Baby')).toHaveCount(0);
    await expect(page.locator('.day-container')).toHaveCount(0);
});
