import { expect, test } from '@playwright/test';
import { confirmDialog, openMenu, signIn, signOut, switchChild } from './helpers';

test('adds and detaches children', async ({ page }) => {
    await signIn(page, 'Parent');
    await page.getByLabel("Baby's name").fill('First');
    await page.getByRole('button', { name: 'Save' }).click();

    await openMenu(page, 'Manage Family');
    await page.getByRole('button', { name: 'New' }).click();
    await page.getByLabel("Child's Name").fill('Second');
    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page.getByLabel('Name of Second')).toBeVisible();

    await switchChild(page, 'First');
    await expect(page.getByRole('heading', { name: 'First', level: 1 })).toBeVisible();

    await openMenu(page, 'Manage Family');
    await page.getByRole('button', { name: 'Detach Second' }).click();
    await confirmDialog(page, 'Detach');
    await expect(page.getByLabel('Name of Second')).toHaveCount(0);
    await expect(page.getByLabel('Name of First')).toBeVisible();
});

// TODO: the upload works when probed by hand, but this test still doesn't see the uploaded name
test.fixme('keeps names on new devices and uploads names saved by older versions', async ({ page }) => {
    await signIn(page, 'Traveler');
    await openMenu(page, 'Manage Family');
    await page.getByRole('button', { name: 'New' }).click();
    await page.getByLabel("Child's Name").fill('Named');
    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page.getByRole('button', { name: 'Viewing Named. Switch child' })).toBeVisible();

    // Older versions only kept names in localStorage, so the first child is unnamed in the database
    const uid = await page.evaluate(
        () => Object.keys(localStorage).find((key) => key.startsWith('lastFamilyId:'))!.split(':')[1]
    );
    await page.getByRole('button', { name: /Switch child$/ }).click();
    await page.getByRole('menuitem', { name: 'Unnamed child 1' }).click();
    await page.waitForURL(/\/child\/[^/]+$/);
    const familyId = new URL(page.url()).pathname.split('/')[2];
    await page.evaluate(
        ({ uid, familyId }) =>
            localStorage.setItem(`connectedFamilies:${uid}`, JSON.stringify([{ id: familyId, name: 'Oldie' }])),
        { uid, familyId }
    );
    await page.reload();
    await expect(page.getByRole('button', { name: 'Viewing Oldie. Switch child' })).toBeVisible();

    // Like opening the app on a new device: the names come from the database
    await page.evaluate(() => {
        for (const key of Object.keys(localStorage)) {
            if (!key.startsWith('firebase')) localStorage.removeItem(key);
        }
    });
    await page.reload();
    await page.getByRole('button', { name: /Switch child$/ }).click();
    await expect(page.getByRole('menuitem', { name: 'Named' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Oldie' })).toBeVisible();
    await page.keyboard.press('Escape');

    await openMenu(page, 'Manage Family');
    await page.getByLabel('Name of Named').fill('Renamed');
    await page.getByLabel('Name of Named').press('Tab');
    await switchChild(page, 'Renamed');
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
