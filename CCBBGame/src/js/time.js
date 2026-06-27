export const turnState = {
    isMyTurn: false,
    started: false
}

let timer = null;

// ターン開始
export function startTurn(isFirstPlayer){
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