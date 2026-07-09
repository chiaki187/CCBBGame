import { send } from "./websocket.js";

const matterCanvas =
document.querySelector("#matterCanvas");


const ctx =
matterCanvas.getContext("2d");


// サーバから来たブロックを保存
let blocks = [];


// 画面基本サイズ（サーバー基準）
const BASE_WIDTH = 1280;
const BASE_HEIGHT = 720;

const canvasWidth = BASE_WIDTH / 3;
const canvasHeight = 10;
const canvasX = BASE_WIDTH / 2;
const canvasY = BASE_HEIGHT - canvasHeight/2; 


export function canvasSize() {
    matterCanvas.width = matterCanvas.clientWidth;
    matterCanvas.height = matterCanvas.clientHeight;

    drawBlocks();
}

// 画面サイズ変更
window.addEventListener("resize", () => {
    canvasSize();
});


// サーバから呼ぶ
export function updateBlocks(serverBlocks){

    blocks = serverBlocks;

    drawBlocks();

}

export function drawBlocks(){

    ctx.clearRect(
        0,
        0,
        matterCanvas.width,
        matterCanvas.height
    );
    
    // 画面サイズに合わせて描画(ブロック、地面)
    
    // 現在の画面幅に対する倍率
    const scaleX = matterCanvas.width / BASE_WIDTH;
    const scaleY = matterCanvas.height / BASE_HEIGHT;

    const groundWidth = canvasWidth * scaleX;
    const groundHeight = canvasHeight * scaleY;
    const groundX = canvasX * scaleX;
    const groundY = canvasY * scaleY;

    ctx.fillStyle = "#666";

    ctx.fillRect(
        groundX - groundWidth / 2,
        groundY - groundHeight / 2,
        groundWidth,
        groundHeight
    );

    blocks.forEach(block=>{


        ctx.save();


        ctx.translate(
            block.x * scaleX,
            block.y * scaleY
        );


        ctx.rotate(
            block.angle
        );


        ctx.fillStyle =
        block.color;


        ctx.fillRect(            
            -20 * scaleX,
            -10 * scaleY,
             40 * scaleX,
             20 * scaleY
        );


        ctx.restore();


    });

}
