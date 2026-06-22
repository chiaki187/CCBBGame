import {
  GestureRecognizer,
  FilesetResolver,
} from "@mediapipe/tasks-vision";


const res = await fetch("/gesture_recognizer.task");
console.log(res.status);
console.log(res.headers.get("content-type"));


let handGesture;


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
        width:320,
        height:180
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


  const now =
    performance.now();


  const result =
    handGesture.recognizeForVideo(
      camera,
      now
    );


  const hands =
    result.landmarks;


  const ctx =
    overlay.getContext("2d");


  ctx.clearRect(
    0,
    0,
    overlay.width,
    overlay.height
  );


  for(const hand of hands){

    drawHand(
      ctx,
      hand,
      overlay.width,
      overlay.height
    );

  }


}