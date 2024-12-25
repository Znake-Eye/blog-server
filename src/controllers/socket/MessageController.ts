import { Service } from "typedi";
import { 
    ConnectedSocket,
    MessageBody, 
    OnConnect, 
    OnDisconnect, 
    OnMessage, 
    SocketController, 
    SocketIO 
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
    connection(@ConnectedSocket() socket: Socket) {
        console.log('client connected with id: ', socket.id);
    }

    @OnDisconnect()
    disconnect(@ConnectedSocket() socket: Socket) {
        console.log('client disconnect with id: ', socket.id);
    }

    @OnMessage('join_room')
    joinRoom(
        @ConnectedSocket() socket: Socket, 
        @MessageBody() message: { roomId: string }, 
    ) {
        const { roomId } = message;
        if(roomId) {
            this.socket.userConnections[roomId] = socket.id;
            console.log('userConnection: ', this.socket.userConnections);

            socket.emit('joined_room', {
                success: true,
                message: `${socket.id} joined the room with roomId: ${roomId}`,
            });
        } 
    }

    @OnMessage('send_message')
    save(@MessageBody() messageData: any) {

        const { roomId , message, sender, receiver} = messageData;
        const { id: receiverId } = receiver;
        if(!roomId) return;

        const receiverRoomId = receiverId?.toString();
        const senderRoomId = sender?.id?.toString();

        const receiverSocketId = this.socket.userConnections[receiverRoomId];
        const senderSocketId = this.socket.userConnections[senderRoomId];

        const messageResponse = {
            from: sender,
            message
        }

        this.socket.adminIo.to(receiverSocketId)
            .to(senderSocketId).emit('sended_message', messageResponse);
        
    }
}