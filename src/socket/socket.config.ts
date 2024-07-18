import { Server, Socket } from 'socket.io';
import { createServer } from 'http';
import app from '../app';

const server = createServer(app);
const io = new Server(server);

const userSocketMap : Record<string, string> = {};

io.on('connection', (socket : Socket) => {
    const userId = socket.handshake.query.userId as string;
    if(userId) userSocketMap[userId] = socket.id;

    io.on('disconnect', () => {
        delete userSocketMap[userId];
    })
});

export const getReceiverSocketId = (receiverId : string) : string | undefined => {
    return userSocketMap[receiverId];
}

export {io, server};