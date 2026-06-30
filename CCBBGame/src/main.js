import { connect,send } from "./js/websocket.js";
import { addBlock } from "./js/blocks.js";

//それぞれの画面取得
const firstView =
document.querySelector("#firstView");

const startgameView =
document.querySelector("#startgameView");

const cameraView =
document.querySelector("#cameraView");

const countDown =
document.querySelector("#countDown");







// カラー関連
import { generatePalette, generateRandomColors
    ,showWaiting ,showOpponentPalette, showSelectedPalette
 } from "./js/color.js";

const fileInput = document.getElementById("fileInput");
const randomBtn = document.getElementById("randomBtn");
const img = document.getElementById("img");

const boxes_me = document.querySelectorAll(".color-box-me");
const boxes_opponent = document.querySelectorAll(".color-box-opponent");
const boxes_selected = document.querySelectorAll(".color-box-selected");


// 相手用ボックス
let opponentBoxes = [];

const decideBtn = document.getElementById("decideBtn");

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

    
    if (data.type === "INIT") {
        myId = data.id;
        console.log("自分ID:", myId);
    }

    if (data.type === "COLOR_STATE") {

        const players = data.players;

        // 人数不足
        if (players.length < 2) {
            showWaiting(myColorDecided);
            return;
        }
        
        // 決定してる色だけ取り出す
        const decidedPlayers = players.filter(p => p.decided);
        console.log(decidedPlayers.length)
        if (decidedPlayers.length === 2) {
            
            // 自分を特定
            const me = players.find(p => p.id === myId);
            // 相手を特定
            const opponent = players.find(p => p.id !== myId)

            if (me && opponent && me.decided && opponent.decided) {
                // 相手のカラー表示
                showOpponentPalette(boxes_opponent, opponent.colors);

            } else {
                console.log("相手データが取得できない");
            }

        } else {
            showWaiting(myColorDecided);
        }
    }

    if (data.type === "SELECT_PLAYER") {
        console.log(data.colors);
        console.log("SELECT");
        const isMe = data.playerId === myId;
        showSelectedPalette(boxes_selected, data.colors, isMe);

        //色が決定したら　5秒後　カメラ画面表示
        setTimeout(() => {
            startgameView.style.display = "none";
            cameraView.style.display = "block";
        }, 5000);

    }

    if(data.type==="SPAWN_BLOCK"){
        console.log("ブロック受信",data);
        addBlock(
            data.x,
            data.y,
            data.color
        );
    }

});





function updateColorsFromBoxes() {
    myColors = Array.from(boxes_me).map(box => box.textContent);
}

// ファイル（画像）選択したときの処理
fileInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const imageUrl = URL.createObjectURL(file);
    img.src = imageUrl;

    img.onload = function () {
        generatePalette(img, boxes_me, colorThief);
        updateColorsFromBoxes();
    };
});

// ランダムカラーボタンを押したときの処理
randomBtn.addEventListener("click", () => {
    // ファイル選択解除
    fileInput.value = "";
    img.src = "";

    generateRandomColors(boxes_me);
    updateColorsFromBoxes();
});

// 色選択
boxes_me.forEach(box => {
    decideBtn.addEventListener("click", () => {

        if (myColorDecided) return; // 決定後は変更不可
        selectedColor = box.textContent;

        // 見た目（選択中）
        boxes_me.forEach(b => b.classList.remove("selected"));
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

    //カメラ起動は時間がかかるので先に起動を開始

    setUpgameView();
    let count=5;
    const timer = setInterval(()=>{
        countDown.textContent=`${count}秒後にゲーム開始です`;

        if(count<=-1){
            clearInterval(timer);
            startgameView.style.display = "none";
            cameraView.style.display = "block";
        }
        count--;
    }, 1000);

    showWaiting(myColorDecided);
});




//カメラ画面
import { setupCamera } from "./js/camera.js";

function setUpgameView(){
    setupCamera(myColors);
}
