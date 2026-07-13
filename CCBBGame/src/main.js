import { connect, send, reConnect } from "./js/websocket.js";
import { startTurn, stopTurn, turnState } from "./js/time.js";
import { playRoulette } from "./js/roulette.js";
import { updateBlocks } from "./js/blocks.js";
import { canvasSize } from "./js/blocks.js";
import { setupCamera,setdownCamera } from "./js/camera.js";

//それぞれの画面取得
const firstView =
document.querySelector("#firstView");

const startgameView =
document.querySelector("#startgameView");

const finishgameView =
document.getElementById("finishgameView");

const cameraView =
document.querySelector("#cameraView");

const resultView =
document.querySelector("#finishgameView");

const countDown =
document.querySelector("#countDown");


const reusltText =
document.getElementById("reusltText");
const dropCountDown =
document.querySelector("#dropCountDown");

const turnPlayer =
document.querySelector("#turnPlayer");

const dropText =
document.querySelector("#dropText");

const whoSelectedText =
document.getElementById("whoSelectedText");

const colorSystemExplainText =
document.getElementById("colorSystemExplainText");

const selectedImage =
document.getElementById("selectedImage");

const palette =
document.getElementById("palette");

const opponent =
document.getElementById("opponent");

const towCard =
document.getElementById("towCard");

const resultComment =
document.getElementById("resultComment");



let saveImage=null;



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

// ゲーム終了結果画面
const resultText = 
document.getElementById("resultText");

const towerHeightText = 
document.getElementById("towerHeightText");



connect((data)=>{

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
        const isMe = data.playerId === myId;

        colorSystemExplainText.style.display = "none";
        // カラールーレット開始
        playRoulette(isMe, () => {
            showSelectedPalette(boxes_selected, data.colors, isMe);
            startCountDown(isMe);

            saveImage=`url(${data.image})`;
            if(isMe){
                palette.style.backgroundImage = saveImage;
                whoSelectedText.textContent="あなたの色が選択されました！";
            }else{
                opponent.style.backgroundImage = saveImage;
                whoSelectedText.textContent="あいての色が選択されました！";
            }
            
            
        });
    }

    if(data.type === "YOUR_TURN"){
        console.log("自分のターン");
        turnPlayer.textContent = "あなたのターンです";
        turnState.isMyTurn = true;

        const color = myColors[Math.floor(Math.random() * myColors.length)];

        send({
            type:"PREPARE_BLOCK",
            color:color
        });
    }
    
    if(data.type === "END_TURN"){
        console.log("相手のターン");
        turnPlayer.textContent = "相手のターンです";
        turnState.isMyTurn = false;
    }

    if(data.type === "OPPONENT_DISCONNECTED"){

        console.log("相手が切断しました");
        stopTurn();

        turnState.started = false;
        turnState.isMyTurn = false;

        alert("相手が切断しました");

        location.reload();

        return;
    }
    
    if (data.type === "RESULT_PLAYERS") {
        stopTurn();
        console.log("RESULT:", data);
        const me = data.players.find(p => p.id === myId);

        turnState.started = false;
        turnState.isMyTurn = false;

        cameraView.style.display = "none";
        finishgameView.style.display = "block";

        const towerHeight = Math.round(data.towerHeight);

        if (me.result === "WIN") {
            reusltText.textContent = "あなたの勝ち！";
            towerHeightText.textContent = `高さ ${towerHeight} px`;
        } else {
            reusltText.textContent = "あなたの負け！";
            towerHeightText.textContent = `高さ ${towerHeight} px`;
        } 

        //最後の戦いのコメント
        if(towerHeight<100){
            resultComment.textContent="挑戦の始まりを感じる一戦でした";
        }else if(towerHeight<200){
            resultComment.textContent="バランス感覚が光る、印象的な対戦でした"
        }else if(towerHeight<300){
            resultComment.textContent="素晴らしい集中力が生んだ、見事な積み上げでした"
        }else{
            resultComment.textContent="まさに職人技が光る、伝説的な積み上げでした"
        }
        towCard.style.backgroundImage = saveImage;
        setdownCamera(); 
    }


    //ブロックの描画
    if(data.type==="STATE"){
        updateBlocks(data.blocks);
    }
    
    if(data.type==="DROP_COUNTDOWN"){
        console.log("受信:", data.count);
        updateDropCountDown(data.count);
        if(data.count<=4){
            dropText.style.display = "none";
        }
    }
    if(data.type==="DROP"){
        dropText.textContent = "drop!";
        dropText.style.display = "block";
    }
    if(data.type === "RESTART_GAME"){
        console.log("リスタートがmainに帰ってきました");
        location.reload();

        finishgameView.style.display = "none";
        firstView.style.display = "block";

        // 必要な変数を初期化
        myColorDecided = false;
        selectedColor = null;
    }

});



function updateColorsFromBoxes() {
    myColors = Array.from(boxes_me).map(box => box.textContent);
}

//画像データ保存用変数
let myImage = null;


// ファイル（画像）選択したときの処理
fileInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) return;

    img.src = URL.createObjectURL(file);

    const reader = new FileReader();

    reader.onload = () => {
        myImage = reader.result;
    };

    reader.readAsDataURL(file);

    img.onload = () => {
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
    decideBtn.style.background="#cccccc";
    myColorDecided = true;
    send({
        id: myId,
        type: "SELECT_COLOR",
        selectedColor: selectedColor,
        colors: myColors,
        image: myImage
    });

    showWaiting(myColorDecided);
});

// 結果画面閉じるボタン
document.getElementById("closeResult").addEventListener("click", () => {
    console.log("リスタートします");
    send({
        type: "RESTART"
    });
    closeResult.style.background="#cccccc";
    closeResult.innerHTML="WAIT..."
});


// ゲーム開始カウントダウン
function startCountDown(isMe) {

    // カメラは先に起動
    setUpgameView();

    let count = 5;
    countDown.innerHTML = `ゲーム開始まで<span class="count-number" style="color:#FA8B8A;">${count}</span>秒！`;
    const timer = setInterval(() => {

        count--;
    
        if(count==1){
            countDown.innerHTML = `ゲーム開始まで<span class="count-number" style="color:#FA8B8A;">${count}</span>秒！`;
        }else if(count==2){
            countDown.innerHTML = `ゲーム開始まで<span class="count-number" style="color:#FACA57">${count}</span>秒！`;
        }else if(count==3){
            countDown.innerHTML = `ゲーム開始まで<span class="count-number"style="color:#68D4CB">${count}</span>秒！`;
        }else if(count==4){
            countDown.innerHTML = `ゲーム開始まで<span class="count-number" style="color:#AB99E0;">${count}</span>秒！`;
        }

        if (count <= 0) {
            clearInterval(timer);
            startgameView.style.display = "none";
            cameraView.style.display = "block";
            turnPlayer.textContent = isMe ? "あなたのターンです" : "相手のターンです";
            canvasSize();
            startTurn();
            if(isMe){
                send({
                    type: "START_MAIN_TURN"
                });
            }
        }

    }, 1000);
}



export function updateDropCountDown(count) {
    if (count <= 0) {
        dropCountDown.textContent = "drop!";
        return;
    }
    dropCountDown.textContent = `${count}秒後にブロックが落ちます`;
}



function setUpgameView(){
    setupCamera(myColors);
}
