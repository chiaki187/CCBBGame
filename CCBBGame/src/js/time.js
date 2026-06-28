export const turnState = {
    isMyTurn: false,
    started: false
}

let timer = null;

// ターン開始
export function startTurn(isFirstPlayer){
  if(timer) return;

    turnState.isMyTurn = isFirstPlayer;
    turnState.started = true;

    console.log(isFirstPlayer ? "先攻（自分）" : "後攻（自分）");

    
    timer = setInterval(() => {
    turnState.isMyTurn = !turnState.isMyTurn;

    if (turnState.isMyTurn) {
      console.log("自分のターン");
    } else {
      console.log("相手のターン");
    }
  }, 5000);

}

export function stopTurn() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }

  turnState.started = false;
  turnState.isMyTurn = false;

  console.log("ターン停止");
}