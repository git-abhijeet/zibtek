import clientPromise from './db.js';
import { randomBytes } from 'crypto';
import { ObjectId } from 'mongodb';

const DEFAULT_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function serializeCookie(name, value, opts = {}) {
    const parts = [`${name}=${value}`];
    if (opts.maxAge) parts.push(`Max-Age=${opts.maxAge}`);
    if (opts.httpOnly) parts.push('HttpOnly');
    if (opts.path) parts.push(`Path=${opts.path}`);
    if (opts.sameSite) parts.push(`SameSite=${opts.sameSite}`);
    if (opts.secure) parts.push('Secure');
    if (opts.domain) parts.push(`Domain=${opts.domain}`);
    return parts.join('; ');
}

async function createSession(userId, { maxAge = DEFAULT_MAX_AGE } = {}) {
    const client = await clientPromise;
    const db = client.db();
    const token = randomBytes(32).toString('hex');
    const now = new Date();
    const session = {
        token,
        userId: typeof userId === 'string' ? new ObjectId(userId) : userId,
        createdAt: now,
        expiresAt: new Date(now.getTime() + maxAge * 1000),
    };
    await db.collection('sessions').insertOne(session);
    const cookie = serializeCookie('session', token, {
        maxAge,
        httpOnly: true,
        path: '/',
        sameSite: 'Lax',
        secure: process.env.NODE_ENV === 'production',
    });
    return { token, cookie };
}

async function getSession(token) {
    if (!token) return null;
    const client = await clientPromise;
    const db = client.db();
    const session = await db.collection('sessions').findOne({ token });
    if (!session) return null;
    if (session.expiresAt && new Date(session.expiresAt) < new Date()) {
        // expired
        await db.collection('sessions').deleteOne({ token });
        return null;
    }
    // Normalize session before returning to server components so they don't
    // accidentally pass non-plain objects (ObjectId, Date, Buffer, etc.) to
    // client components which Next.js can't serialize.
    return {
        token: session.token,
        userId:
            session.userId && typeof session.userId === 'object' && session.userId.toString
                ? session.userId.toString()
                : session.userId,
        createdAt: session.createdAt ? new Date(session.createdAt).toISOString() : null,
        expiresAt: session.expiresAt ? new Date(session.expiresAt).toISOString() : null,
    };
}

async function deleteSession(token) {
    const client = await clientPromise;
    const db = client.db();
    await db.collection('sessions').deleteOne({ token });
}

export { createSession, getSession, deleteSession };
