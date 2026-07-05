import { send } from "./websocket.js";

export const turnState = {
    isMyTurn: false,
    started: false
}

export function startTurn() {
    turnState.started = true;
}

export function stopTurn() {
    turnState.started = false;
    turnState.isMyTurn = false;

    console.log("ターン停止");
}
