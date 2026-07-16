import { connect, send, reConnect } from "./js/websocket.js";
import { startTurn, stopTurn, turnState } from "./js/time.js";
import { playRoulette } from "./js/roulette.js";
import { updateBlocks } from "./js/blocks.js";
import { canvasSize } from "./js/blocks.js";
import { setupCamera,setdownCamera } from "./js/camera.js";

//それぞれの画面取得
const firstView =
document.querySelector("#firstView");

const waitingView =
document.querySelector("#waitingView");

const startgameView =
document.querySelector("#startgameView");

const startBtn = 
document.getElementById("startBtn");

const nextDelete =
document.querySelectorAll(".nextDelete");

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

const cameraContent = 
document.getElementById("cameraContent");

const playerCard =
document.getElementById("playerCard");

const towCard =
document.getElementById("towCard");

const resultComment =
document.getElementById("resultComment");

const backColorMe =
document.getElementById("backColor-me");

const backColorOpponent =
document.getElementById("backColor-opponent");

//音
const rouletteAudio = new Audio("/audio/roulette.mp3");
const stapRuletteAudio = new Audio("/audio/stapRulette.mp3");
const fallAudio = new Audio("/audio/fall.mp3");
const BGMAudio = new Audio("/audio/BGM.wav");
const winAudio = new Audio("/audio/win.mp3");
const roseAudio = new Audio("/audio/rose.mp3");




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


function connectServer(){
    connect((data)=>{

        if(data.type === "PLAYER_COUNT"){


        }else if(data.type === "START_GAME"){
            //画面の表示切替
            waitingView.style.display = "none";
            startgameView.style.display = "block";

            requestAnimationFrame(() => {
                originalSizes.delete("startgameContent");
                fitToScreen("startgameContent");
            });
        }

        
        if (data.type === "INIT") {
            myId = data.id;
            console.log("自分ID:", myId);
        }

        if (data.type === "COLOR_STATE") {

            const players = data.players;

            // 人数不足
            if (players.length < 2) {
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

            } 
        }
            

        if (data.type === "SELECT_PLAYER") {
            const isMe = data.playerId === myId;
            nextDelete.forEach(element => {
                element.style.display = "none";
            });

            colorSystemExplainText.style.display = "none";
            whoSelectedText.textContent = "お互いのカラーパレット選択が終了しました";
            countDown.textContent = "ルーレットを開始します！";
            // カラールーレット開始
            // 3秒待ってからルーレット開始
            setTimeout(() => {
                rouletteAudio.play();
                playRoulette(isMe, () => {
                    // showSelectedPalette(boxes_selected, data.colors, isMe);
                    setTimeout(() => {
                        stapRuletteAudio.play();
                        startCountDown(isMe);
                        if (isMe) {
                            backColorMe.style.background="rgba(255, 255, 255,0.5)";
                            palette.style.backgroundImage = saveImage;
                            whoSelectedText.textContent = "あなたの色が選択されました！";
                            boxes_opponent.forEach(box => {
                                box.style.backgroundColor = "#ccc";
                            });
                            opponent.style.backgroundColor = "#e2e2e2";
                        } else {
                            backColorOpponent.style.background="rgba(255, 255, 255,0.5)";
                            opponent.style.backgroundImage = saveImage;
                            whoSelectedText.textContent = "相手の色が選択されました！";
                            boxes_me.forEach(box => {
                                box.style.backgroundColor = "#ccc";
                            });
                            palette.style.backgroundColor = "#e2e2e2";
                        }
                    }, 1000); //  2秒
                    saveImage = `url(${data.image})`;
                });
            }, 2000); //  3秒
        }

        if(data.type === "YOUR_TURN"){
            const player = data.player;
            // playerCard.style.backgroundImage = `url(${player.image})`;
            console.log("自分のターン");
            turnPlayer.textContent = "あなた";
            turnState.isMyTurn = true;

            const color = myColors[Math.floor(Math.random() * myColors.length)];

            send({
                type:"PREPARE_BLOCK",
                color:color
            });
        }
        
        if(data.type === "END_TURN"){
            const player = data.player;
            console.log(player);
            // playerCard.style.backgroundImage = `url(${player.image})`;
            console.log("相手のターン");
            turnPlayer.textContent = "相手";
            turnState.isMyTurn = false;
        }

        if(data.type === "OPPONENT_DISCONNECTED"){
            console.log("相手が切断しました");
            stopTurn();

            turnState.started = false;
            turnState.isMyTurn = false;

            alert("相手が切断しました");

            send({
                type: "GO_TITLE"
            });
            // location.reload();

            // return;
        }
        
        if (data.type === "RESULT_PLAYERS") {
            BGMAudio.pause();
            stopTurn();
            console.log("RESULT:", data);
            const me = data.players.find(p => p.id === myId);

            turnState.started = false;
            turnState.isMyTurn = false;

            cameraView.style.display = "none";
            finishgameView.style.display = "block";

            requestAnimationFrame(() => {
                originalSizes.delete("finishgameContent");
                fitToScreen("finishgameContent");
            });

            const towerHeight = Math.round(data.towerHeight);

            if (me.result === "WIN") {
                winAudio.play();
                reusltText.textContent = "あなたの勝ち！";
                towerHeightText.innerHTML = `<span style="font-size:48px; font-weight:bold;">${towerHeight}</span> cm`;
            } else {
                roseAudio.play();
                reusltText.textContent = "あなたの負け！";
                towerHeightText.innerHTML = `<span style="font-size:48px; font-weight:bold;">${towerHeight}</span> cm`;
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
            // if(data.count<=4){
            //     // dropText.style.display = "none";
            // }
        }
        if(data.type==="DROP"){
            fallAudio.play();
            dropText.style.display = "block";

            dropText.classList.remove("dropAnimation");
            void dropText.offsetWidth;
            dropText.classList.add("dropAnimation");
        }

        if(data.type === "GO_TITLE"){
            if(data.playerId === myId){
                location.reload();
            }
        }

    // if(data.type === "RESTART_GAME"){
    //     console.log("リスタートがmainに帰ってきました");
    //     location.reload();

    //     finishgameView.style.display = "none";
    //     firstView.style.display = "block";

    //     // 必要な変数を初期化
    //     myColorDecided = false;
    //     selectedColor = null;
    // }

    });
}

dropText.addEventListener("animationend", () => {
    dropText.classList.remove("dropAnimation");
    dropText.style.display = "none";
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
        console.log("押されました");

        if (myColorDecided) return; // 決定後は変更不可
        selectedColor = box.textContent;

        // 見た目（選択中）
        boxes_me.forEach(b => b.classList.remove("selected"));
        box.classList.add("selected");
        });
});

// STARTボタンを押したときの処理
startBtn.addEventListener("click", () => {
    firstView.style.display = "none";
    waitingView.style.display = "block";

    requestAnimationFrame(() => {
        originalSizes.delete("waitingContent");
        fitToScreen("waitingContent");
    });

    connectServer();
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

    // showWaiting(myColorDecided);
});

// 結果画面閉じるボタン
document.getElementById("closeResult").addEventListener("click", () => {
    console.log("リスタートします");
    send({
        type: "GO_TITLE"
    });
    // closeResult.style.background="#cccccc";
    // closeResult.innerHTML="WAIT..."
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
            BGMAudio.loop = true; // ループON
            BGMAudio.play();
            clearInterval(timer);
            startgameView.style.display = "none";
            cameraView.style.display = "block";
            cameraView.style.backgroundImage = saveImage;
            playerCard.style.backgroundImage = saveImage;

            requestAnimationFrame(() => {
                originalSizes.delete("cameraContent");
                fitToScreen("cameraContent");
            });

            turnPlayer.textContent = isMe ? "あなた" : "相手";
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
        // dropCountDown.textContent = "drop!";
        return;
    }
    dropCountDown.textContent = count;
}



function setUpgameView(){
    setupCamera(myColors);
}


const originalSizes = new Map();

function fitToScreen(elementId) {

    const element = document.getElementById(elementId);
    if (!element) return;

    // transformを解除して本来のサイズを取得
    element.style.transform = "none";

    // 毎回最新サイズを取得
    const rect = element.getBoundingClientRect();

    const width = rect.width;
    const height = rect.height;

    originalSizes.set(elementId, {
        width,
        height
    });

    const scaleX = window.innerWidth / width;
    const scaleY = window.innerHeight / height;

    const scale = Math.min(scaleX, scaleY, 0.8);

    element.style.transformOrigin = "center center";
    element.style.transform = `translate(0,0) scale(${scale})`;

}

window.addEventListener("resize", () => {

    fitToScreen("firstViewContent");
    fitToScreen("waitingContent");
    fitToScreen("startgameContent");
    fitToScreen("cameraContent");
    fitToScreen("finishgameContent");

});

