import express from "express";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import path from "path";
import { fileURLToPath } from "url";


// 現在のファイル場所を取得
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// -------------------------
// Express（画面配信用）
// -------------------------

const app = express();


// distフォルダを公開する
app.use(
    express.static(
        path.join(__dirname, "../../dist")
    )
);


// HTTPサーバ作成
const server = createServer(app);



// -------------------------
// WebSocket（通信部分）
// -------------------------

const wss = new WebSocketServer({
    server
});


let playerCount = 0;



console.log("サーバ起動");



wss.on("connection", (ws) => {

    console.log("接続数:", wss.clients.size);

    const sendPlayerCount = () => {
        const message = {
            type: "PLAYER_COUNT",
            count: wss.clients.size
        };

        wss.clients.forEach(client => {
            if (client.readyState === 1) {
                client.send(JSON.stringify(message));
            }
        });
    };

    sendPlayerCount();

    if (wss.clients.size === 2) {

        const startMessage = {
            type: "START_GAME"
        };

        wss.clients.forEach(client => {
            if (client.readyState === 1) {
                client.send(JSON.stringify(startMessage));
            }
        });
    }

    ws.on("close", () => {
        console.log("切断");

        setTimeout(sendPlayerCount, 10);
    });
});



// Renderのポート
const PORT = process.env.PORT || 3000;



server.listen(PORT,()=>{

    console.log(
        `HTTP + WebSocket server start ${PORT}`
    );

});