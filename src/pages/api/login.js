import { findUserByEmail, verifyPassword } from '@/lib/auth.js';
import { createSession } from '@/lib/sessions.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Missing fields' });
    const user = await findUserByEmail(email);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = verifyPassword(user.passwordHash, password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const { cookie } = await createSession(user._id || user.id);
    res.setHeader('Set-Cookie', cookie);
    return res.status(200).json({ ok: true, user: { id: user._id?.toString?.() || user.id, email: user.email, name: user.name } });
}
