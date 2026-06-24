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

// プレイヤーの情報(カラー)を保存するためのMap
const players = new Map();

console.log("サーバ起動");

function sendColorState() {
    const list = [];
    players.forEach(p => {
        list.push({
            id: p.id,
            colors: p.colors,
            selectedColor: p.selectedColor,
            decided: p.decided
        });
    });

    const message = {
        type: "COLOR_STATE",
        players: list
    };

    console.log("COLOR_STATE送信:", list);

    wss.clients.forEach(client => {
        if (client.readyState === 1) {
            client.send(JSON.stringify(message));
        }
    });
}

wss.on("connection", (ws) => {
    console.log("接続数:", wss.clients.size);

    // 1. 接続したプレイヤーに一意のIDを発行して通知 (INIT)
    const playerId = Math.random().toString(36).substring(2, 9);
    
    // プレイヤー情報を初期化してMapに保存
    players.set(ws, {
        id: playerId,
        colors: [],
        selectedColor: null,
        decided: false
    });

    console.log("プレイヤー情報:", players.get(ws));

    ws.send(JSON.stringify({
        type: "INIT",
        id: playerId
    }));

    const sendPlayerCount = () => {

        ws.on("message",(message)=>{

            const data = JSON.parse(message.toString())
            console.log(data.type);
            if (data.type === "SELECT_COLOR") {
                const playerData = players.get(ws);
                console.log(playerData);
                if (playerData) {
                    playerData.colors = data.colors;
                    playerData.selectedColor = data.selectedColor;
                    playerData.decided = true; // 決定フラグをtrueにする

                    // マップの情報を更新
                    players.set(ws, playerData);
                    
                    // お互いの決定状態が変わったので全員に同期
                    sendColorState();
                }
            }

            wss.clients.forEach(client=>{

                if(client.readyState === 1){

                    client.send(
                        message.toString()
                    );
                }
            });
        });


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
        
        players.delete(ws);

        // 状態を全員に再送
        sendColorState();

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