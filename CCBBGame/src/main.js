import { connect } from "./js/websocket.js";


const firstView =
document.querySelector("#firstView");

const startgameView =
document.querySelector("#startgameView");





connect((data)=>{

    console.log("受信データ:", data);
    if(data.type === "PLAYER_COUNT"){


    }else if(data.type === "START_GAME"){
        //画面の表示切替
        firstView.style.display = "none";
        startgameView.style.display = "block";

    }


});