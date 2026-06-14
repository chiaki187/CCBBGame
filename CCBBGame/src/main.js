import { connect } from "./js/websocket.js";


const app =
document.querySelector("#app");


const status =
document.createElement("h1");


status.textContent =
"待機中...";


app.appendChild(status);



connect((data)=>{


    if(data.type === "PLAYER_COUNT"){


        status.textContent =
        `プレイヤー${data.count}人接続`;

    }


});