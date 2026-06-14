import { WebSocketServer } from "ws";


const wss = new WebSocketServer({
    port:3000
});


let playerCount = 0;


console.log("サーバ起動");


wss.on("connection",(ws)=>{

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
        client.send(
            JSON.stringify(message)
        );
    });

});