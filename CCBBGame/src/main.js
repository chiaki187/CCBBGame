import { connect,send } from "./js/websocket.js";

//それぞれの画面取得
const firstView =
document.querySelector("#firstView");

const startgameView =
document.querySelector("#startgameView");


//チャット用の要素取得
const chatInput =
document.querySelector("#chatInput");

const sendButton =
document.querySelector("#sendButton");

const chatArea =
document.querySelector("#chatArea");



connect((data)=>{

    console.log("受信データ:", data);
    if(data.type === "PLAYER_COUNT"){


    }else if(data.type === "START_GAME"){
        //画面の表示切替
        firstView.style.display = "none";
        startgameView.style.display = "block";

    }
    if(data.type === "CHAT"){

        const p =
        document.createElement("p");

        p.textContent =
        data.message;

        chatArea.appendChild(p);

    }


});


sendButton.addEventListener("click",()=>{

    const text =
    chatInput.value;

    send({

        type:"CHAT",

        message:text

    });

});




//画像の色取得
import { generatePalette,generateRandomColors } from "./js/color.js";
const fileInput = document.getElementById("fileInput");
const randomBtn = document.getElementById("randomBtn");
const img = document.getElementById("img");
const boxes = document.querySelectorAll(".color-box");

const colorThief = new ColorThief();

// ファイル（画像）選択
fileInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const imageUrl = URL.createObjectURL(file);
    img.src = imageUrl;

    img.onload = function () {
        generatePalette(img, boxes, colorThief);
    };
});

// ランダムカラー
randomBtn.addEventListener("click", () => {
    // ファイル選択解除
    fileInput.value = "";
    img.src = "";

    generateRandomColors(boxes);
});





//カメラ画面
import { setupCamera } from "./js/camera.js";

setupCamera();