import { json } from '@sveltejs/kit';
import fs from 'node:fs';
import path from 'node:path';
import Parser from 'rss-parser';
import { v4 as uuidv4 } from 'uuid';
import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import { decodeBase64, encodeBase64 } from '$lib/utils/base64';

const parser = new Parser();

export async function GET({ url }) {
    // Basic security check - in production require a secret token
    const token = url.searchParams.get('token');
    const password = url.searchParams.get('password');
    const cronSecret = env.CRON_SECRET || 'dev_secret';
    const adminPassword = env.ADMIN_PASSWORD;
    
    const isAuthorized = (token && token === cronSecret) || (password && password === adminPassword) || dev;
    
    if (!isAuthorized) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const gToken = env.GITHUB_TOKEN;
    const gOwner = env.GITHUB_OWNER;
    const gRepo = env.GITHUB_REPO;
    const useGitHub = !dev && gToken && gOwner && gRepo;

    let notifications: any[] = [];
    let sha = null;

    if (useGitHub) {
        try {
            const apiUrl = `https://api.github.com/repos/${gOwner}/${gRepo}/contents/src/lib/data/notifications.json`;
            const getRes = await fetch(apiUrl, {
                headers: {
                    'Authorization': `Bearer ${gToken}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'RunMyAIModel-AutoFetcher'
                }
            });
            if (getRes.ok) {
                const getJson = await getRes.json();
                sha = getJson.sha;
                notifications = JSON.parse(decodeBase64(getJson.content));
            }
        } catch (e) {
            console.error('Failed to fetch notifications from GitHub', e);
        }
    } else {
        const notificationsPath = path.resolve('src/lib/data/notifications.json');
        try {
            notifications = JSON.parse(fs.readFileSync(notificationsPath, 'utf-8'));
        } catch (e) {
            notifications = [];
        }
    }

    const results = {
        modelsAdded: 0,
        hardwareAdded: 0,
        errors: [] as string[]
    };

    // 1. Poll HuggingFace Trending
    try {
        const hfRes = await fetch('https://huggingface.co/api/trending?limit=10&type=model');
        if (hfRes.ok) {
            const trending = await hfRes.json();
            for (const item of trending) {
                const repoId = item.repoId || item.id;
                const exists = notifications.find(n => n.metadata?.repoId === repoId);
                
                if (!exists) {
                    notifications.unshift({
                        id: uuidv4(),
                        type: 'model',
                        title: `Trending Model: ${repoId.split('/').pop()}`,
                        description: `${repoId} is trending on HuggingFace. Parameters and config can be auto-fetched.`,
                        status: 'pending',
                        timestamp: new Date().toISOString(),
                        metadata: {
                            repoId: repoId,
                            link: `https://huggingface.co/${repoId}`
                        }
                    });
                    results.modelsAdded++;
                }
            }
        }
    } catch (e: any) {
        results.errors.push(`HF Polling Error: ${e.message}`);
    }

    // 2. Poll TechPowerUp GPU RSS
    try {
        const feed = await parser.parseURL('https://www.techpowerup.com/rss/news');
        const gpuKeywords = ['GPU', 'NVIDIA', 'AMD', 'Radeon', 'GeForce', 'RTX', 'RX', 'Graphics'];
        const gpuNews = feed.items.filter(item => 
            gpuKeywords.some(key => item.title?.includes(key) || item.contentSnippet?.includes(key))
        ).slice(0, 5);

        for (const item of gpuNews) {
            const exists = notifications.find(n => n.metadata?.link === item.link);
            if (!exists) {
                notifications.unshift({
                    id: uuidv4(),
                    type: 'hardware',
                    title: item.title || 'New Hardware Alert',
                    description: item.contentSnippet?.slice(0, 150) + '...',
                    status: 'pending',
                    timestamp: new Date().toISOString(),
                    metadata: {
                        link: item.link
                    }
                });
                results.hardwareAdded++;
            }
        }
    } catch (e: any) {
        results.errors.push(`RSS Polling Error: ${e.message}`);
    }

    // Save if changed
    if (results.modelsAdded > 0 || results.hardwareAdded > 0) {
        notifications = notifications.slice(0, 50);
        const newContent = JSON.stringify(notifications, null, 2);

        if (useGitHub) {
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
                    message: `Auto-synced notifications (${results.modelsAdded + results.hardwareAdded} new items)`,
                    content: encodeBase64(newContent),
                    sha: sha
                })
            });
        } else if (dev) {
            const notificationsPath = path.resolve('src/lib/data/notifications.json');
            fs.writeFileSync(notificationsPath, newContent);
        }
    }

    return json({ success: true, results });
}
