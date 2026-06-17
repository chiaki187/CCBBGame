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