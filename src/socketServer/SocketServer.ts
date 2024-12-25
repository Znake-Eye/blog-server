import { Server as SocketServer } from "socket.io";
import { Server as HttpServer } from "http";
import { SocketControllers } from "socket-controllers";
import Container from "typedi";
import { MessageController } from "../controllers/socket/MessageController";
import socketAuthMiddleware from "../middleware/SocketMiddleware";
export class GlobalSocketServer {
    private static instance: GlobalSocketServer;
    private io: SocketServer;
    public adminIo: any;
    public userIo: any;
    public userConnections: any = {}
    constructor(httpServer: HttpServer) {
        // const allowIP = process.env.ALLOW_IP ? JSON.parse(process.env.ALLOW_IP) || [];
        const allowIP = process.env.ALLOW_IP;

        this.io = new SocketServer(httpServer, {
            cors: {
                origin: allowIP,
                credentials: true,
            }
        });

        this.adminIo = this.io.of('/admin');
        this.userIo = this.io.of('/user');

        this.setUpSocketEvent();

        new SocketControllers({
            io: this.adminIo,
            container: Container,
            controllers: [MessageController],
        })

        new SocketControllers({
            io: this.userIo,
            container: Container,
            controllers: [MessageController]
        })
    }

    public static getInstance(serverInstance?: HttpServer): GlobalSocketServer {
        if(!GlobalSocketServer.instance) {
            if(!serverInstance) {
                throw new Error("Http server is need to create socket server");
            }

            this.instance = new GlobalSocketServer(serverInstance);
        }
        return this.instance;
    }

    private setUpSocketEvent() {

        this.adminIo.use(socketAuthMiddleware);

        this.io.on("connect", (socket) => {
            console.log('a socket is connected with id:', socket.id);
            
            socket.on("disconnect", () => {
                console.log('a socket is disconnected');
            })
        })

    }
}