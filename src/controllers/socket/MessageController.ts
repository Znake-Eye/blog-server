import { Service } from "typedi";
import { 
    ConnectedSocket,
    MessageBody, 
    OnConnect, 
    OnDisconnect, 
    OnMessage, 
    SocketController, 
    SocketIO,
} from "socket-controllers";
import { Socket } from "socket.io";
import { GlobalSocketServer } from "../../socketServer/SocketServer";

@Service()
@SocketController()
export class MessageController {

    private socket: GlobalSocketServer;

    constructor() {
        this.socket = GlobalSocketServer.getInstance();
    }

    @OnConnect()
    async connection(@ConnectedSocket() socket: Socket) {
        console.log('client connected with id: ', socket.id);
    }

    @OnDisconnect()
    disconnect(@ConnectedSocket() socket: Socket) {

        for (const [roomKey, socketRoomsId] of this.socket.clientConnections) {
            if (socketRoomsId.has(socket.id)) {

                socketRoomsId.delete(socket.id);

                if (this.socket.clientConnections.get(roomKey).size === 0) {
                    this.socket.clientConnections.delete(roomKey);
                }

                break;
            }
        }

        console.log('client disconnect with id: ', socket.id);
        console.log('client connections',this.socket.clientConnections);
    }

    @OnMessage('join_room')
    joinRoom(
        @ConnectedSocket() socket: Socket, 
        @MessageBody() message: { roomId: string }, 
    ) {
        const { roomId } = message;
        if(roomId) {

            if (!this.socket.clientConnections.has(roomId)) {
                this.socket.clientConnections.set(roomId, new Set());
            }

            this.socket.clientConnections.get(roomId).add(socket.id);
            console.log('client connection: ', this.socket.clientConnections);

            socket.emit('joined_room', {
                success: true,
                message: `${socket.id} joined the room with roomId: ${roomId}`,
            });
        } 
    }

    @OnMessage('send_message')
    save(@MessageBody() messageData: any) {

        const { message, sender, receiver} = messageData;

        if (sender?.id && receiver?.id) {
            const { id: receiverId } = receiver;

            const receiverRoomId = receiverId?.toString();
            const senderRoomId = sender?.id?.toString();

            const receiverSocketsId = this.socket.clientConnections.get(receiverRoomId);
            const senderSocketsId = this.socket.clientConnections.get(senderRoomId);
            const allSocketIds = [...receiverSocketsId, ...senderSocketsId];

            const messageResponse = {
                from: sender,
                message
            }

            allSocketIds.forEach((socketId) => {
                this.socket.adminIo.to(socketId).emit('sended_message', messageResponse);
            });
        }
        

    }
}