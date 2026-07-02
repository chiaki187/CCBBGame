const matterCanvas =
document.querySelector("#matterCanvas");


const ctx =
matterCanvas.getContext("2d");


// サーバから来たブロックを保存
let blocks = [];


// サーバから呼ぶ
export function updateBlocks(serverBlocks){

    blocks = serverBlocks;

    drawBlocks();

}



function drawBlocks(){
    ctx.clearRect(
        0,
        0,
        matterCanvas.width,
        matterCanvas.height
    );


    blocks.forEach(block=>{


        ctx.save();


        ctx.translate(
            block.x,
            block.y
        );


        ctx.rotate(
            block.angle
        );


        ctx.fillStyle =
        block.color;


        ctx.fillRect(
            -30,
            -15,
            60,
            30
        );


        ctx.restore();


    });

}