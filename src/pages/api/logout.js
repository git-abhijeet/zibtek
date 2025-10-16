import { deleteSession } from '@/lib/sessions.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const cookieHeader = req.headers.cookie || '';
    const match = cookieHeader.split(';').map(c => c.trim()).find(c => c.startsWith('session='));
    const token = match ? match.split('=')[1] : null;

    if (token) {
        try {
            await deleteSession(token);
        } catch (e) {
            console.error('Failed to delete session', e);
        }
    }

    const secure = process.env.NODE_ENV === 'production' ? ' Secure' : '';
    res.setHeader('Set-Cookie', `session=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax;${secure}`);
    return res.status(200).json({ ok: true });
}
