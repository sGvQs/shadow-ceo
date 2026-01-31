import { NextRequest, NextResponse } from 'next/server';
import { getRooms, createRoom } from '@/backend/services/rooms';

export async function GET() {
    try {
        const rooms = await getRooms();
        return NextResponse.json(rooms);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch rooms' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name } = body;

        if (!name) {
            return NextResponse.json({ error: 'Room name is required' }, { status: 400 });
        }

        const room = await createRoom(name);
        return NextResponse.json(room);
    } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to create room' }, { status: 500 });
    }
}
