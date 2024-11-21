import { Service } from "typedi";
import { ConnectedSocket, MessageBody, OnConnect, OnDisconnect, OnMessage, SocketController } from "socket-controllers";
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

    @OnMessage('save')
    save(@ConnectedSocket() socket: Socket, @MessageBody() message: any) {
        console.log('recieved message : ', message);
        this.socket.adminIo.emit('saved', {
            data: message,
            message: 'Save data succesfully',
        });
        
    }
}