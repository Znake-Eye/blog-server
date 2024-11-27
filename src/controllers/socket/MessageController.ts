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
        @SocketIO() io: Socket
    ) {
        const { roomId } = message;
        if(roomId) {
            socket.join(roomId);
            console.log(`A client join a room with id: ${roomId}`);
            this.socket.adminIo.to(roomId).emit('joined_room', {
                success: true,
                message: `${socket.id} joined the room with roomId: ${roomId}`,
            });
            // io.to(roomId).emit('joined_room', {
            //     success: true,
            //     message: `${socket.id} joined the room with roomId: ${roomId}`,
            // });

            console.log('all roomid: ', socket.rooms);
        } 
    }

    @OnMessage('send_message')
    save(@ConnectedSocket() socket: Socket, @MessageBody() messageData: any) {

        const { roomId , message, sender, receiver} = messageData;
        const { id: receiverId } = receiver;
        if(!roomId) return;

        const receiverRoomId = receiverId?.toString();
        const senderRoomId = sender?.id?.toString();

        const socketRooms = Array.from(socket.rooms);
        if(!socketRooms.includes(receiverRoomId)) {
            socket.join(receiverRoomId);
        }
        console.log('socket room: ',socket.rooms);

        const messageResponse = {
            from: sender,
            message
        }

        this.socket.adminIo.to(receiverRoomId).to(senderRoomId).emit('sended_message', messageResponse);

        // this.socket.adminIo.emit('saved', {
        //     data: message,
        //     message: 'Save data succesfully',
        // });
        
    }
}