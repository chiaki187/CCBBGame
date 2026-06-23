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

// カラー関連
import { generatePalette, generateRandomColors } from "./js/color.js";

const fileInput = document.getElementById("fileInput");
const randomBtn = document.getElementById("randomBtn");
const img = document.getElementById("img");

const boxes = document.querySelectorAll(".color-box");

// 相手用ボックス
let opponentBoxes = [];

const decideBtn = document.getElementById("decideBtn");
const result = document.getElementById("result");

const colorThief = new ColorThief();

let selectedColor = null;
let myColorDecided = false;
let myColors = [];
let myId = null;



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
    
    if (data.type === "INIT") {
        myId = data.id;
        console.log("自分ID:", myId);
    }
    if (data.type === "COLOR_STATE") {
        console.log("COLOR_STATE:", data);

        const players = data.players;

        // 人数不足
        console.log("プレイヤーデータ:", players);
        if (players.length < 2) {
            showWaiting();
            return;
        }
        
        // 決定してる色だけ取り出す
        const decidedPlayers = players.filter(p => p.decided);
        console.log(decidedPlayers.length)
        if (decidedPlayers.length === 2) {
            
            // 自分を特定
            const me = players.find(p => p.id === myId);
            // 相手を特定
            const opponent = players.find(p => p.id !== myId);


            if (me && opponent && me.decided && opponent.decided) {
                showOpponentPalette(opponent.colors);
            } else {
                console.log("相手データが取得できない");
            }

        } else {
            showWaiting();
        }
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


function updateColorsFromBoxes() {
    myColors = Array.from(boxes).map(box => box.textContent);
}

// ファイル（画像）選択
fileInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const imageUrl = URL.createObjectURL(file);
    img.src = imageUrl;

    img.onload = function () {
        generatePalette(img, boxes, colorThief);
        updateColorsFromBoxes();
    };
});

// ランダムカラー
randomBtn.addEventListener("click", () => {
    // ファイル選択解除
    fileInput.value = "";
    img.src = "";

    generateRandomColors(boxes);
    updateColorsFromBoxes();
});

console.log("boxes:", boxes.length);
// 色選択
boxes.forEach(box => {
    decideBtn.addEventListener("click", () => {

        if (myColorDecided) return; // 決定後は変更不可
        selectedColor = box.textContent;

        // 見た目（選択中）
        boxes.forEach(b => b.classList.remove("selected"));
        box.classList.add("selected");
        });
});


// 決定ボタンを押したときの処理
decideBtn.addEventListener("click", () => {

    if (!selectedColor || myColorDecided) return;

    myColorDecided = true;
    send({
        id: myId,
        type: "SELECT_COLOR",
        selectedColor: selectedColor,
        colors: myColors
    });

    showWaiting();
});


function showWaiting() {
    if(!myColorDecided) return;
    result.textContent = "カラー選択中...";
}

function showOpponentPalette(colors) {
    result.textContent = "";

    // すでにあれば削除
    opponentBoxes.forEach(box => box.remove());
    opponentBoxes = [];

    colors.forEach(color => {
        const div = document.createElement("div");
        div.className = "color-box";
        div.style.backgroundColor = color;
        div.textContent = color;
        
        result.appendChild(div);
        opponentBoxes.push(div);
    });

}