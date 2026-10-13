import { expect, Page } from '@playwright/test';

/** Sign in through the Auth emulator's Google popup, creating the account the first time */
export async function signIn(page: Page, name: string) {
    const email = `${name.toLowerCase()}@example.com`;
    await page.goto('/');
    const popupPromise = page.waitForEvent('popup');
    await page.getByRole('button', { name: 'Login' }).click();
    const popup = await popupPromise;
    await popup.waitForLoadState();
    const existing = popup.locator('#accounts-list li', { hasText: email });
    if (await existing.count()) {
        await existing.click();
    } else {
        await popup.locator('#add-account-button').click();
        await popup.locator('#email-input').fill(email);
        await popup.locator('#display-name-input').fill(name);
        await popup.locator('#sign-in').click();
    }
    await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible();
}

export async function signOut(page: Page) {
    await page.getByRole('button', { name: 'Logout' }).click();
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
}

/** Open an item from the toolbar menu, following submenus */
export async function openMenu(page: Page, ...items: string[]) {
    await page.getByRole('button', { name: 'Menu' }).click();
    for (const item of items) {
        await page.getByRole('menuitem', { name: item, exact: true }).click();
    }
}

/** Switch to another child with the switcher next to the title */
export async function switchChild(page: Page, name: string) {
    await page.getByRole('button', { name: /^Viewing .*Switch child$/ }).click();
    await page.getByRole('menuitem', { name }).click();
    await expect(page.getByRole('button', { name: `Viewing ${name}. Switch child` })).toBeVisible();
}

export async function confirmDialog(page: Page, action: string) {
    await page.getByRole('dialog').getByRole('button', { name: action }).click();
    await expect(page.getByRole('dialog')).toBeHidden();
}
