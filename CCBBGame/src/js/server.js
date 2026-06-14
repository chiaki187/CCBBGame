import { WebSocketServer } from "ws";

// Renderが自動で割り当てるポート（無ければローカル用の3000番）を使う
const PORT = process.env.PORT || 3000;

const wss = new WebSocketServer({
    port: PORT
});

let playerCount = 0;

// 起動ログにもポート番号を表示しておくと確認しやすくなります
console.log(`サーバ起動（ポート: ${PORT}）`);

wss.on("connection", (ws) => {

    playerCount++;

    console.log(
        "接続人数:",
        playerCount
    );

    const message = {
        type: "PLAYER_COUNT",
        count: playerCount
    };

    // 全員へ送信
    wss.clients.forEach(client => {
        if (client.readyState === 1) { // 接続が生きているクライアントだけに送る安全策
            client.send(
                JSON.stringify(message)
            );
        }
    });

    // 【重要】切断されたときの処理（人数を減らすため）
    ws.on("close", () => {
        playerCount--;
        console.log("切断。現在の接続人数:", playerCount);
        
        const leaveMessage = {
            type: "PLAYER_COUNT",
            count: playerCount
        };
        
        wss.clients.forEach(client => {
            if (client.readyState === 1) {
                client.send(JSON.stringify(leaveMessage));
            }
        });
    });
});