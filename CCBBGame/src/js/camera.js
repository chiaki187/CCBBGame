import {
  GestureRecognizer,
  FilesetResolver,
} from "@mediapipe/tasks-vision";
import { addBlock } from "./blocks.js";
import { connect,send } from "./websocket.js";

const res = await fetch("/gesture_recognizer.task");
console.log(res.status);
console.log(res.headers.get("content-type"));


//タイマー
let spawnTimer = 0;
let lastTime = 0;


let handGesture;
let prevX = null; // ← 追加
let prevY = null; // ← 追加

//決定した色を入れておく箱
let colors=[];


async function initDetector() {

  const vision =
    await FilesetResolver.forVisionTasks("/wasm");


  handGesture =
    await GestureRecognizer.createFromOptions(
      vision,
      {
        baseOptions:{
          modelAssetPath:
          "/gesture_recognizer.task",
          delegate:"GPU",
        },

        numHands:2,
        runningMode:"VIDEO",

        minHandDetectionConfidence:0.1,
        minHandPresenceConfidence:0.1,
        minTrackingConfidence:0.1,
      }
    );
}



export async function setupCamera(color){

  await initDetector();

  colors=color;
  color.forEach((color)=>{
    console.log("こんなカラーです"+color);
  });

  const camera =
    document.querySelector("#camera");


  const overlay =
    document.querySelector("#overlay");


  const canvas =
    document.querySelector("#canvas");


  const stream =
    await navigator.mediaDevices.getUserMedia({
      video:{
        width:640,
        height:360
      },
      audio:false
    });


  camera.srcObject = stream;


  await camera.play();


  drawFrame(
    camera,
    overlay,
    canvas
  );
}

const CONNECTIONS = [
  [0,1],[1,2],[2,3],[3,4],
  [5,6],[6,7],[7,8],
  [9,10],[10,11],[11,12],
  [13,14],[14,15],[15,16],
  [17,18],[18,19],[19,20],
  [0,5],[5,9],[9,13],[13,17],[17,0]
];


function drawHand(ctx, hand, w, h){

  for(let i = 0; i < 21; i++){

    const p = hand[i];

    const hx = (1-p.x) * w;
    const hy = p.y * h;

    ctx.fillRect(hx, hy, 3, 3);
  }


  ctx.beginPath();

  for(const [ai,bi] of CONNECTIONS){

    const a = hand[ai];
    const b = hand[bi];

    ctx.moveTo(
      (1-a.x)*w,
      a.y*h
    );

    ctx.lineTo(
      (1-b.x)*w,
      b.y*h
    );

  }

  ctx.stroke();
}


function drawFrame(camera, overlay, canvas){

  requestAnimationFrame(
    ()=>drawFrame(camera,overlay,canvas)
  );


  const now = performance.now();


  const result =
    handGesture.recognizeForVideo(
      camera,
      now
    );


  const hands =
    result.landmarks;


  const gestures =
    result.gestures;


  const octx =
    overlay.getContext("2d");


  octx.clearRect(
    0,
    0,
    overlay.width,
    overlay.height
  );


  // 手の骨格表示
  for(const hand of hands){

    drawHand(
      octx,
      hand,
      overlay.width,
      overlay.height
    );

  }


  // ジェスチャーがない場合終了
  if(gestures.length === 0){
    prevX = null;
    prevY = null;
    return;
  }


  const name =
    gestures[0][0].categoryName;



  // 人差し指を立てている場合
  if(name === "Pointing_Up"){
    console.log("指たててます！");
    const finger = hands[0][8];
    const fx = (1 - finger.x) * overlay.width;
    const fy = finger.y * overlay.height;


    // 外部に公開
    fingerState.x = fx;
    fingerState.y = fy;
    fingerState.isPointing = true;

    //赤い丸
    octx.beginPath();
    octx.arc(fx, fy, 10, 0, Math.PI * 2);
    octx.fillStyle = "red";
    octx.fill();


    let now =performance.now();
    if(now-lastTime>3000){
      const thisColor=colors[Math.floor(Math.random() * 8)];


      //ブロックの情報を通信
      const blockInfo={
        type:"SPAWN_BLOCK",
        x:fingerState.x-250,
        y:fingerState.y,
        color:thisColor
      }
      send(blockInfo);

      lastTime = now;
    }
   


  }else{

    // 指を立てていない時はリセット
    fingerState.x = null;
    fingerState.y = null;
    fingerState.isPointing = false;
    prevX = null;
    prevY = null;

  }

}

//手の位置情報を外に向けて公開
export let fingerState={
    x:null,
    y:null,
    isPointing: false,
};