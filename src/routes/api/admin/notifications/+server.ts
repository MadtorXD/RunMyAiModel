import { json } from '@sveltejs/kit';
import fs from 'node:fs';
import path from 'node:path';
import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import { decodeBase64, encodeBase64 } from '$lib/utils/base64';

async function fetchNotifications() {
    const gToken = env.GITHUB_TOKEN;
    const gOwner = env.GITHUB_OWNER;
    const gRepo = env.GITHUB_REPO;

    if (!dev && gToken && gOwner && gRepo) {
        try {
            const apiUrl = `https://api.github.com/repos/${gOwner}/${gRepo}/contents/src/lib/data/notifications.json`;
            const res = await fetch(apiUrl, {
                headers: {
                    'Authorization': `Bearer ${gToken}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'RunMyAIModel-AutoFetcher'
                }
            });
            if (res.ok) {
                const data = await res.json();
                return {
                    notifications: JSON.parse(decodeBase64(data.content)),
                    sha: data.sha
                };
            }
        } catch (e) {
            console.error('GitHub fetch failed', e);
        }
    }

    const notificationsPath = path.resolve('src/lib/data/notifications.json');
    try {
        return { notifications: JSON.parse(fs.readFileSync(notificationsPath, 'utf-8')) as any[], sha: null };
    } catch (e) {
        return { notifications: [] as any[], sha: null };
    }
}

export async function GET({ url }) {
    const password = url.searchParams.get('password');
    if (!dev && password !== env.ADMIN_PASSWORD) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { notifications } = await fetchNotifications();
    return json(notifications);
}

export async function PATCH({ request }) {
    try {
        const { id, status, password } = await request.json();

        if (!dev && password !== env.ADMIN_PASSWORD) {
            return json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { notifications, sha } = await fetchNotifications();
        const index = notifications.findIndex((n: any) => n.id === id);

        if (index === -1) {
            return json({ error: 'Notification not found' }, { status: 404 });
        }

        notifications[index].status = status;
        
        const newContent = JSON.stringify(notifications, null, 2);

        const gToken = env.GITHUB_TOKEN;
        const gOwner = env.GITHUB_OWNER;
        const gRepo = env.GITHUB_REPO;

        if (!dev && gToken && gOwner && gRepo && sha) {
            const apiUrl = `https://api.github.com/repos/${gOwner}/${gRepo}/contents/src/lib/data/notifications.json`;
            await fetch(apiUrl, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${gToken}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'RunMyAIModel-AutoFetcher',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: `Update notification status: ${id}`,
                    content: encodeBase64(newContent),
                    sha: sha
                })
            });
        } else if (dev) {
            const notificationsPath = path.resolve('src/lib/data/notifications.json');
            fs.writeFileSync(notificationsPath, newContent);
        }

        return json({ success: true, notification: notifications[index] });
    } catch (e: any) {
        return json({ error: e.message }, { status: 400 });
    }
}
