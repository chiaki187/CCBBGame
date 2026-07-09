import express from "express";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import path from "path";
import { fileURLToPath } from "url";
import Matter from "matter-js";

const {
    Engine,
    Bodies,
    World,
    Events,
    Body
} = Matter;



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



const BASE_WIDTH = 1280;
const BASE_HEIGHT = 720;

const groundWidth = BASE_WIDTH / 3;
const groundHeight = 10;

const groundX = BASE_WIDTH / 2;
const groundY = BASE_HEIGHT - groundHeight;

const blockWidth = 80;
const blockHeight = 40;

const OUT_Y = BASE_HEIGHT + 50;


// Room管理
const rooms = new Map();

function sendToRoom(room, data) {

    room.players.forEach((player, ws) => {

        if (ws.readyState === 1) {
            ws.send(
                JSON.stringify(data)
            );
        }
    });
}

function createRoom() {

    const engine = Engine.create();
    const world = engine.world;

    const ground =
        Bodies.rectangle(
            groundX,
            groundY,
            groundWidth,
            groundHeight,
            {
                isStatic: true,
                label: "ground"
            }
        );

    World.add(
        world,
        ground
    );

    const room = {
        id: Math.random().toString(36).substring(2, 12),
        players: new Map(),
        noEntry: false,
        engine,
        world,
        ground,
        turnIndex: 0,
        turnTimer: null,
        mainTurnStarted: false,
        gameFinished: false
    };

    // 物理演算
    room.engineInterval =
        setInterval(() => {
            Engine.update(
                room.engine,
                1000 / 60
            );
        }, 1000 / 60);

    setupRoomEvents(room);

    return room;
}

function findAvailableRoom() {
    for (const room of rooms.values()) {
        console.log("NG:",room.noEntry);
        if (room.noEntry) {
            continue;
        }

        if (room.players.size < 2) {
            return room;
        }
    }
    const room = createRoom();

    rooms.set(
        room.id,
        room
    );

    return room;
}

console.log("サーバ起動");

function sendColorState(room) {
    const list = [];
    room.players.forEach(p => {
        list.push({
            id: p.id,
            colors: p.colors,
            selectedColor: p.selectedColor,
            decided: p.decided
        });
    });
    
    sendToRoom(room,
        {
            type: "COLOR_STATE",
            players: list
        }
    );
}

function sendSelectedPlayer(room) {
    console.log("SELECT_PLAYER送信");
    const playerList = Array.from(room.players.values());

    if (playerList.length !== 2) return;

    // ランダムで1人選択
    const selected = playerList[Math.floor(Math.random() * playerList.length)];
    
    sendToRoom(
        room,
        {
            type: "SELECT_PLAYER",
            playerId: selected.id,
            colors: selected.colors
        }
    );
}

wss.on("connection", (ws) => {
    const room = findAvailableRoom();
    ws.roomId = room.id;

    console.log("接続数:", wss.clients.size);
    console.log("接続Room:" + room.id);

    // 接続したプレイヤーに一意のIDを発行して通知 (INIT)
    const playerId = Math.random().toString(36).substring(2, 9);
    
    // プレイヤー情報を初期化してMapに保存
    room.players.set(ws, {
        id: playerId,
        colors: [],
        selectedColor: null,
        decided: false,
        isMyTurn: false,
        currentBlock: null, // 現在のブロック情報
        currentColor: null, // 現在のブロックの色
        previewX: BASE_WIDTH / 2, // 仮ブロックの初期位置x
        previewY: 50 // 仮ブロックの初期位置y
    });

    ws.send(JSON.stringify({
        type:"INIT",
        id:playerId
    }));

    if(room.players.size === 2){
        sendToRoom(
            room,
            {type: "START_GAME"}
        );
    }

    ws.on("message",(message)=>{

        const data =
        JSON.parse(message.toString());

        const room = rooms.get(ws.roomId);
        if(!room){
            return;
        }

        if(data.type==="SELECT_COLOR"){

            const player = room.players.get(ws);
            if(!player){
                return;
            }

            player.colors=data.colors;
            player.selectedColor=data.selectedColor;
            player.decided=true;

            sendColorState(room);

            const decidedPlayers = 
            Array.from(room.players.values()).filter(p=>p.decided);

            if(decidedPlayers.length===2){
                sendSelectedPlayer(room);
            }
        }

        else if(data.type === "START_MAIN_TURN") {
            if (room.mainTurnStarted) {
                return;
            }
            room.mainTurnStarted = true;
            console.log("ターン開始 Room:" + room.id);

            startMainTurn(room);
        }

        if(data.type === "TURN_UPDATE"){
            const player = room.players.get(ws);
            if(player){
                player.isMyTurn = data.isMyTurn;
            }
        }

        else if(data.type === "PREPARE_BLOCK"){
            const player = room.players.get(ws);

            if(!player){
                return;
            }
            // 生成するブロックカラー記憶
            player.currentColor = data.color;

            // 仮ブロック初期位置
            player.previewX = BASE_WIDTH / 2;
            player.previewY = 50;
        }

        else if(data.type === "MOVE_BLOCK"){ // ブロックの位置移動(x座標のみ)
            const player = room.players.get(ws);
            
            if(!player){
                return;
            }

            if(!player.isMyTurn){
                return;
            }
            // ブロック位置決め（x軸方向）
            player.previewX = data.x;
        }

        // クライアントへ返す通信
        if(data.type !== "SPAWN_BLOCK" && data.type!="MOVE_BLOCK"){
            sendToRoom(room, data);
        }
    });

    ws.on("close",()=>{
        const room = rooms.get(ws.roomId);
        if(!room){
            return;
        }
        room.noEntry = true;

        // 切断されたプレイヤーを削除
        room.players.delete(ws);
        
        // 残っているプレイヤーだけに送信
        room.players.forEach((player, otherWs) => {
            if (otherWs.readyState === 1) {
                otherWs.send(JSON.stringify({
                    type: "OPPONENT_DISCONNECTED"
                }));
            }
        });
        
        // room.players.forEach((player, otherWs) => {
        //     if (otherWs !== ws && otherWs.readyState === 1) {
        //         otherWs.send(JSON.stringify({
        //             type: "OPPONENT_DISCONNECTED"
        //         }));
        //     }
        // });
        
        // room.players.clear();

        // clearInterval(room.turnTimer);
        // clearInterval(room.engineInterval);
        // rooms.delete(room.id);
        
        // if (room.players.size === 0) {
        //     clearInterval(room.turnTimer);
        //     clearInterval(room.engineInterval);
        //     rooms.delete(room.id);
        // }
        
        // setTimeout(() => {
        //         clearInterval(room.turnTimer);
        //         clearInterval(room.engineInterval);
        //         rooms.delete(room.id);
        // }, 500);


    });
});

function getTowerHeight(room) {
    // 落下済みブロック
    const settledBlocks = room.world.bodies
                            .filter(body =>
                                body.label === "block" &&
                                body.isSettled === true
                            );

    if (settledBlocks.length === 0) {
        return 0;
    }
    // 落下済みブロックの高さ
    const highestY = Math.min(...settledBlocks.flatMap(block => block.vertices.map(v => v.y)));
    // 地面から落下済みブロックまでの高さ
    return groundY - highestY;
}

// イベント関数（room別）
function setupRoomEvents(room) {
    Events.on(room.engine, "afterUpdate", ()=>{
        if(room.gameFinished){
            return;
        }

        for(const body of room.world.bodies){
            if(body.label !== "block"){
                continue;
            }

            if(body.position.y > OUT_Y){
                room.gameFinished = true;
                const towerHeight = getTowerHeight(room);
                room.finalHeight = towerHeight;

                console.log("Game Over", room.id, ", Height:", towerHeight);
                const resultPlayers = [];
                
                room.players.forEach(player => {
                    resultPlayers.push({
                        id: player.id,
                        result: !player.isMyTurn ? "LOSE" : "WIN"
                    });
                });
                
                sendToRoom(
                    room,
                    {
                        type: "RESULT_PLAYERS",
                        players: resultPlayers,
                        towerHeight: towerHeight
                    }
                );
                break;
            }
        }
    });

    Events.on(room.engine, "collisionStart", event => {
        event.pairs.forEach(pair => {
            const a = pair.bodyA;
            const b = pair.bodyB;

            // 接触したらtrue
            const blockToGround =
                a.label === "block" &&
                b.label === "ground";

            const groundToBlock =
                a.label === "ground" &&
                b.label === "block";
                
            const blockToBlock =
                a.label === "block" &&
                b.label === "block";

            if (blockToGround) {
                a.isSettled = true;
            }
            if (groundToBlock) {
                b.isSettled = true;
            }
            if (blockToBlock) {
                a.isSettled = true;
                b.isSettled = true;
            }
        });
    });
}

function startMainTurn(room) {
    if(room.gameFinished){
        return;
    }

    const playerSockets = Array.from(room.players.keys());

    if (playerSockets.length < 2) {
        return;
    }

    const currentWs = playerSockets[room.turnIndex];
    const currentPlayer = room.players.get(currentWs);

    if(!currentPlayer){
        return;
    }

    currentPlayer.isMyTurn = true;

    currentWs.send(JSON.stringify({
        type: "YOUR_TURN"
    }));

    console.log("ターン開始:", currentPlayer.id);

    // カウントダウン開始
    let count = 5;

    sendToRoom(
        room,
        {
            type: "DROP_COUNTDOWN",
            count
        }
    )

    room.turnTimer = setInterval(() => {
        if(room.gameFinished){
            clearInterval(room.turnTimer);
            return;
        }
        count--;

        sendToRoom(
            room,
            {
                type: "DROP_COUNTDOWN",
                count
            }
        )

        if (count > 0) {
            return;
        }

        clearInterval(room.turnTimer);

        // ブロック落下時のテキスト反映
        sendToRoom(
            room,
            {
                type: "DROP"
            }
        )

        // ブロックを生成して落下させる
        const color = currentPlayer.currentColor;
        if (color) {

            const realBlock =
                Bodies.rectangle(
                    currentPlayer.previewX,
                    currentPlayer.previewY,
                    blockWidth,
                    blockHeight,
                    {
                        label: "block",
                        restitution: 0,
                        friction: 0.8,
                        frictionStatic: 1,
                        render: {
                            fillStyle: color
                        }
                    }
                );

            // 地面や他のブロックに接触したかの有無（空中ならfalse）
            realBlock.isSettled = false;

            World.add(room.world, realBlock);
        }

        currentPlayer.isMyTurn = false;

        currentWs.send(JSON.stringify({
            type: "END_TURN"
        }));

        room.turnIndex = (room.turnIndex + 1) % playerSockets.length;

        // ターン（ゲーム）開始
        startMainTurn(room);

    }, 1000);

}

setInterval(()=>{

    rooms.forEach(room => {

        const blockStates =
        room.world.bodies
        .filter(
            body=>body.label==="block"
        )
        .map(
            block=>({
                id:block.id,
                x:block.position.x,
                y:block.position.y,
                angle:block.angle,
                color:block.render.fillStyle,
                label:block.label
            })
        );

        // 仮ブロック
        room.players.forEach(player => {
            if(
                player.isMyTurn &&
                player.currentColor
            ){
                blockStates.push({
                    id:"preview",
                    x:player.previewX,
                    y:player.previewY,
                    angle:0,
                    color:player.currentColor,
                    label:"preview"
                });
            }
        });

        sendToRoom(
            room,
            {
                type: "STATE",
                blocks: blockStates
            }
        );
    });
},50);



// Renderのポート
const PORT = process.env.PORT || 3000;



server.listen(PORT,()=>{

    console.log(
        `HTTP + WebSocket server start ${PORT}`
    );

});