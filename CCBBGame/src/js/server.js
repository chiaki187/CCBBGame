import express from "express";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import path from "path";
import { fileURLToPath } from "url";
import Matter from "matter-js";

const {
    Engine,
    Runner,
    Bodies,
    World
} = Matter;

//物理演算準備
const engine = Engine.create();

const world = engine.world;


// 地面
const ground =
Bodies.rectangle(
    320,
    550,
    900,
    10,
    {
        isStatic:true
    }
);


World.add(
    world,
    ground
);


// 物理演算開始
setInterval(()=>{

    Engine.update(
        engine,
        1000 / 60
    );

},1000/60);




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
//ブロックを管理
const gameState={
    blocks:[]
};

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

function sendSelectedPlayer() {
    console.log("SELECT_PLAYER送信");
    const playerList = Array.from(players.values());

    if (playerList.length !== 2) return;

    // ランダムで1人選択
    const selected = playerList[Math.floor(Math.random() * playerList.length)];
    console.log("型:", typeof selected.colors);
    const message = {
        type: "SELECT_PLAYER",
        playerId: selected.id,
        colors: selected.colors
    };

    wss.clients.forEach(client => {
        if (client.readyState === 1) {
            client.send(JSON.stringify(message));
        }
    });
}

wss.on("connection", (ws) => {

    console.log("接続数:", wss.clients.size);


    const playerId =
    Math.random().toString(36).substring(2,9);


    players.set(ws,{
        id:playerId,
        colors:[],
        selectedColor:null,
        decided:false
    });


    ws.send(JSON.stringify({
        type:"INIT",
        id:playerId
    }));



    // ★ここに置く
    ws.on("message",(message)=>{

        const data =
        JSON.parse(message.toString());


        console.log(data.type);



        if(data.type==="SELECT_COLOR"){

            const playerData = players.get(ws);

            if(playerData){

                playerData.colors=data.colors;
                playerData.selectedColor=data.selectedColor;
                playerData.decided=true;

                players.set(ws,playerData);


                sendColorState();


                const decidedPlayers =
                Array.from(players.values())
                .filter(p=>p.decided);


                if(decidedPlayers.length===2){

                    sendSelectedPlayer();

                }

            }

        }



        else if(data.type==="SPAWN_BLOCK"){
            const block =
            Bodies.rectangle(
                data.x,
                data.y,
                40,
                20,
                {
                    label:"block",
                    render:{
                        fillStyle:data.color
                    }
                }
            );


            World.add(
                world,
                block
            );

        }

        // クライアントへ返す通信
        if(data.type !== "SPAWN_BLOCK"){

            wss.clients.forEach(client=>{

                if(client.readyState===1){

                    client.send(
                        JSON.stringify(data)
                    );

                }

            });

        }
    });



    if(wss.clients.size===2){

        wss.clients.forEach(client=>{

            if(client.readyState===1){

                client.send(JSON.stringify({
                    type:"START_GAME"
                }));

            }

        });

    }



    ws.on("close",()=>{

        console.log("切断");


        players.delete(ws);


        sendColorState();

    });


});


setInterval(()=>{


    const blocks =
    world.bodies.filter(
        body=>body.label==="block"
    );



    const state={

        type:"STATE",

        blocks:
        blocks.map(block=>({

            id:block.id,

            x:block.position.x,

            y:block.position.y,

            angle:block.angle,

            color:block.render.fillStyle

        }))

    };



    wss.clients.forEach(client=>{


        if(client.readyState===1){

            client.send(
                JSON.stringify(state)
            );

        }


    });


},50);



// Renderのポート
const PORT = process.env.PORT || 3000;



server.listen(PORT,()=>{

    console.log(
        `HTTP + WebSocket server start ${PORT}`
    );

});