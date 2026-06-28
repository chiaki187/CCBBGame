import { fingerState } from "./camera";
import { turnState } from "./time.js";
import { send } from "./websocket.js";

import Matter from "matter-js";
const { Engine, Render, Runner, Bodies, World, Events } = Matter;

const engine = Engine.create();

// canvasに重ねて描画
const matterCanvas =
document.querySelector("#matterCanvas");


const render = Render.create({

  canvas:matterCanvas,

  engine,

  options:{
    wireframes:false,
    background:"transparent"
  }

});

const canvasWidth = render.canvas.width;
const canvasHeight = render.canvas.height;

// 地面
// const ground = Bodies.rectangle(320, 550, 900, 10, { isStatic: true });
const groundWidth = canvasWidth / 3;
const groundHeight = 10;
const groundX = canvasWidth / 2;// - groundWidth / 2;
const groundY = canvasHeight - groundHeight; 
console.log(canvasWidth, canvasHeight);
const ground = Bodies.rectangle(
  groundX,   // 横中央
  groundY,
  groundWidth,       // 幅も自動で合わせる
  groundHeight,
  { isStatic: true }
);

// 落下判定ライン（これより下に行ったらアウト）
const OUT_Y = groundY + 100;

// ゲーム終了判定
let isGameOver = false;

World.add(engine.world, ground);

// ブロックを追加する関数
export function addBlock(x, y){
  const block = Bodies.rectangle(x, y, 60, 30, {
    render: { fillStyle: "#e74c3c" }
  });
  World.add(engine.world, block);
}


Events.on(engine, "afterUpdate", () => {
  if (isGameOver) return;

  const bodies = engine.world.bodies;

  for (const body of bodies) {
    // 地面は除外
    if (body === ground) continue;

    // 落下チェック
    if (body.position.y > OUT_Y) {
      isGameOver = true;

      const isLose = turnState.isMyTurn;

      // サーバーへ送信
      send({
        type: "FINISH_GAME",
        result: isLose ? "LOSE" : "WIN"
      });


      // エンジン止める
      Runner.stop(Runner.create());

      break;
    }
  }
});



Render.run(render);
Runner.run(Runner.create(), engine);