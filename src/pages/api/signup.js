import { createUser } from '@/lib/auth.js';
import { createSession } from '@/lib/sessions.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const { name, email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Missing fields' });
    try {
        const user = await createUser({ name: name || '', email, password, isAdmin: false });
        const { cookie } = await createSession(user.id || user._id);
        res.setHeader('Set-Cookie', cookie);
        return res.status(201).json({ ok: true, user });
    } catch (e) {
        return res.status(400).json({ error: e.message });
    }
}
