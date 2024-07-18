import { server } from './socket/socket.config';

const PORT : number | 9780 = process.env.PORT || 9780;

server.listen(PORT, () => console.log(`Started server on ${PORT}`));