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
        console.log('client connected');
    }

    @OnDisconnect()
    disconnect(@ConnectedSocket() socket: Socket) {
        console.log('client disconnect');
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
        // console.log('recieved message : ', message);

        const { roomId , message, sender} = messageData;
        if(!roomId) return;

        this.socket.adminIo.to(roomId).emit('sended_message', {
            from: sender,
            message
        });

        // this.socket.adminIo.emit('saved', {
        //     data: message,
        //     message: 'Save data succesfully',
        // });
        
    }
}