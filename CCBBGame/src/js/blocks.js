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

// 地面
const ground = Bodies.rectangle(320, 550, 900, 10, { isStatic: true });
World.add(engine.world, ground);

// ブロックを追加する関数
export function addBlock(x, y,color){
  console.log("こんな色が来ました！"+color);
  const block = Bodies.rectangle(x, y, 60, 30, {
    render: { fillStyle: color }
  });
  World.add(engine.world, block);
}

Render.run(render);
Runner.run(Runner.create(), engine);