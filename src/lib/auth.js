import clientPromise from './db.js';
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';

function hashPassword(password, salt = null) {
    salt = salt || randomBytes(16).toString('hex');
    const derived = scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${derived}`;
}

function verifyPassword(stored, password) {
    const [salt, derived] = stored.split(':');
    const attempt = scryptSync(password, salt, 64).toString('hex');
    const a = Buffer.from(attempt, 'hex');
    const b = Buffer.from(derived, 'hex');
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
}

async function findUserByEmail(email) {
    const client = await clientPromise;
    const db = client.db();
    return db.collection('users').findOne({ email: email.toLowerCase() });
}

async function createUser({ name, email, password, isAdmin = false }) {
    const client = await clientPromise;
    const db = client.db();
    const existing = await db.collection('users').findOne({ email: email.toLowerCase() });
    if (existing) throw new Error('Email in use');
    const passwordHash = hashPassword(password);
    const user = {
        name: name || '',
        email: email.toLowerCase(),
        passwordHash,
        isAdmin: !!isAdmin,
        createdAt: new Date(),
    };
    const r = await db.collection('users').insertOne(user);
    return { id: r.insertedId.toString(), name: user.name, email: user.email, isAdmin: user.isAdmin };
}

export { findUserByEmail, createUser, verifyPassword };
