import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/sessions';
import ChatClient from '@/components/ChatClient';

export default async function HomePage() {
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;
    const session = await getSession(token);

    if (!session) {
        return redirect('/login');
    }

    // Ensure we pass only plain values to client components. Convert ObjectId to string if needed.
    const userId = typeof session.userId === 'string' ? session.userId : String(session.userId);
    return <ChatClient userId={userId} />;
}
