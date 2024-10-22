import express from 'express';
import path from 'path';
import "reflect-metadata";
import "es6-shim";
import * as dotEnv from "dotenv";
// import { createExpressServer } from 'routing-controllers';
// import "./src/controllers/UserController";
import { useExpressServer } from 'routing-controllers';
import cors from "cors";
import currentUser from './src/currentUser/CurrentUser';

dotEnv.config();

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
        path.join(__dirname, "/src/controllers", "**","*.ts")
    ]
});

app.listen(port, () => {
    console.log(`server is running on port ${port}`);
});

