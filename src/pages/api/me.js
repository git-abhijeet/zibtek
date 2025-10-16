import { getSession } from '@/lib/sessions.js';
import clientPromise from '@/lib/db.js';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    const cookieHeader = req.headers.cookie || '';
    const match = cookieHeader.split(';').map(c => c.trim()).find(c => c.startsWith('session='));
    const token = match ? match.split('=')[1] : null;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });

    const session = await getSession(token);
    if (!session) return res.status(401).json({ error: 'Not authenticated' });

    const client = await clientPromise;
    const db = client.db();
    // getSession normalizes userId to a string; convert back to ObjectId for lookup
    const userId = typeof session.userId === 'string' ? new ObjectId(session.userId) : session.userId;
    const user = await db.collection('users').findOne({ _id: userId });
    if (!user) return res.status(404).json({ error: 'User not found' });

    return res.status(200).json({ user: { id: user._id.toString(), name: user.name, email: user.email, isAdmin: user.isAdmin } });
}
