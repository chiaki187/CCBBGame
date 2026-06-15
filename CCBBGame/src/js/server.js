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

    playerCount++;


    console.log(
        "接続人数:",
        playerCount
    );


    const message = {
        type:"PLAYER_COUNT",
        count:playerCount
    };


    // 全員へ送信
    wss.clients.forEach(client=>{

        if(client.readyState === 1){

            client.send(
                JSON.stringify(message)
            );

        }

    });



    ws.on("close",()=>{


        playerCount--;


        console.log(
            "切断:",
            playerCount
        );


        const leaveMessage = {
            type:"PLAYER_COUNT",
            count:playerCount
        };


        wss.clients.forEach(client=>{

            if(client.readyState === 1){

                client.send(
                    JSON.stringify(leaveMessage)
                );

            }

        });


    });


});



// Renderのポート
const PORT = process.env.PORT || 3000;



server.listen(PORT,()=>{

    console.log(
        `HTTP + WebSocket server start ${PORT}`
    );

});