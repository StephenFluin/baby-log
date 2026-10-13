import { expect, Page, test } from '@playwright/test';
import { confirmDialog, openMenu, signIn, signOut } from './helpers';

async function createInvite(page: Page) {
    await page.getByRole('button', { name: 'Create invite link' }).click();
    const link = await page.getByLabel('Invite link').inputValue();
    expect(link).toMatch(/\/attach\/[\w-]{20,}$/);

    // Every way of sending the invite carries the same link
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.getByRole('button', { name: 'Copy link' }).click();
    await expect(page.getByRole('button', { name: 'Copied!' })).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(link);
    const mailto = await page.getByRole('link', { name: 'Email the invite' }).getAttribute('href');
    expect(decodeURIComponent(mailto!)).toContain(link);
    return new URL(link).pathname;
}

test('shares a child with an invite link that only works once', async ({ page }) => {
    await signIn(page, 'Owner');
    await page.getByLabel("Baby's name").fill('Shared');
    await page.getByRole('button', { name: 'Save' }).click();
    await page.getByRole('button', { name: 'Create New Day' }).click();
    await expect(page.locator('.day-container')).toHaveCount(1);
    const invite = await createInvite(page);
    await signOut(page);

    // The invited person joins and sees the same log
    await signIn(page, 'Helper');
    await page.goto(invite);
    await page.getByRole('button', { name: 'Add Shared' }).click();
    await expect(page.getByRole('heading', { name: 'Shared', level: 1 })).toBeVisible();
    await expect(page.locator('.day-container')).toHaveCount(1);
    await signOut(page);

    // Nobody else can reuse the invite
    await signIn(page, 'Stranger');
    await page.goto(invite);
    await expect(page.getByRole('alert')).toContainText('expired or was already used');
    await expect(page.getByRole('button', { name: 'Add Shared' })).toHaveCount(0);
    await signOut(page);

    // The owner can see who has access and remove them
    await signIn(page, 'Owner');
    await openMenu(page, 'Manage Family');
    const shared = page.getByRole('region', { name: 'Shared' });
    await expect(shared.getByRole('listitem')).toHaveText([/Owner\s*\(you\)/, /Helper/]);
    await shared.getByRole('button', { name: 'Remove Helper from Shared' }).click();
    await confirmDialog(page, 'Remove');
    await expect(shared.getByText('Helper')).toHaveCount(0);
});

test('explains that links from before invites no longer work', async ({ page }) => {
    await signIn(page, 'Latecomer');
    await page.goto('/attach/some-family/Someone');
    await expect(page.getByRole('alert')).toContainText('no longer works');
    await expect(page.getByRole('button', { name: 'Add Someone' })).toHaveCount(0);
});
