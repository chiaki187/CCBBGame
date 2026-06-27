import { fingerState } from "./camera";

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
const groundY = canvasHeight - 10; 
console.log(canvasWidth, canvasHeight);
const ground = Bodies.rectangle(
  groundX,   // 横中央
  groundY,
  groundWidth,       // 幅も自動で合わせる
  groundHeight,
  { isStatic: true }
);

World.add(engine.world, ground);

// ブロックを追加する関数
export function addBlock(x, y){
  const block = Bodies.rectangle(x, y, 60, 30, {
    render: { fillStyle: "#e74c3c" }
  });
  World.add(engine.world, block);
}

Render.run(render);
Runner.run(Runner.create(), engine);