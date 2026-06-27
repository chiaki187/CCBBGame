import {
  GestureRecognizer,
  FilesetResolver,
} from "@mediapipe/tasks-vision";
import { addBlock } from "./blocks.js";
import { turnState } from "./time.js";

const res = await fetch("/gesture_recognizer.task");
console.log(res.status);
console.log(res.headers.get("content-type"));


let handGesture;
let prevX = null; // ← 追加
let prevY = null; // ← 追加


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



export async function setupCamera(){

  await initDetector();


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

const octx =
    overlay.getContext("2d");

// 仮--------　ブロック生成時間管理
let lastBlockTime = 0;
let lastDetectTime = 0;

function drawFrame(camera, overlay, canvas){

  requestAnimationFrame(
    ()=>drawFrame(camera,overlay,canvas)
  );

  // const octx =
  //   overlay.getContext("2d");

  // 開始前 or 相手ターン　描画停止
  if (!turnState.started || !turnState.isMyTurn) {
    octx.clearRect(0, 0, overlay.width, overlay.height);

    fingerState.x = null;
    fingerState.y = null;
    fingerState.isPointing = false;

    return;
  }

  const now = performance.now();

  // 処理を軽くするため
  if (now - lastDetectTime < 100) return;
    lastDetectTime = now;

  const result =
    handGesture.recognizeForVideo(
      camera,
      now
    );


  const hands =
    result.landmarks;


  const gestures =
    result.gestures;


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

  // 仮--------
  if (now - lastBlockTime > 500) { // 0.5秒間隔でブロック生成
    addBlock(fingerState.x - 250, fingerState.y);
    lastBlockTime = now;
  }
  // ----------
  // addBlock(fingerState.x-250, fingerState.y);
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