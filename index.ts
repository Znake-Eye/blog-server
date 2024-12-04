import express from 'express';
import path from 'path';
import "reflect-metadata";
import "es6-shim";
import * as dotEnv from "dotenv";
import { useExpressServer } from 'routing-controllers';
import cors from "cors";
import currentUser from './src/currentUser/CurrentUser';

import { Server } from 'http';
import { GlobalSocketServer } from './src/socketServer/SocketServer';

const envFile = process.env.NODE_ENV === "production" ? ".env.production" : ".env";
dotEnv.config({ path: path.resolve(__dirname, envFile) });

const isDevelopment: boolean = process.env.NODE_ENV === "dev";

const app = express();
const port = process.env.PORT;

const allowIp = process.env.ALLOW_IP;
app.use(cors({
    origin : allowIp,
    credentials : true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended : false}));

useExpressServer(app, {
    routePrefix: "/api",
    currentUserChecker: currentUser,
    controllers: [
        path.join(__dirname, "/src/controllers", "**",`*.${isDevelopment ? "ts" : "js"}`)
    ],
    // middlewares: [path.join(__dirname, '/middleware/**/*.ts')],
    // middlewares: [errorHandler],
});

const httpServer = new Server(app);
const serverInstance = httpServer.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
})

GlobalSocketServer.getInstance(serverInstance);
console.log('globalSocketServer');
console.log(GlobalSocketServer.getInstance());
