import { connect,send } from "./websocket.js";

const opponentDiv = document.getElementById("opponent");
const selectedDiv = document.getElementById("selected");

// 画像からパレット生成
export function generatePalette(img, boxes, colorThief) {
    const palette = colorThief.getPalette(img, 8);

    palette.forEach((rgb, index) => {
        const color = `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
        boxes[index].style.backgroundColor = color;
        boxes[index].textContent = color;
    });
}

// ランダムカラー生成
export function generateRandomColors(boxes) {
    boxes.forEach(box => {
        const r = Math.floor(Math.random() * 256);
        const g = Math.floor(Math.random() * 256);
        const b = Math.floor(Math.random() * 256);

        const color = `rgb(${r}, ${g}, ${b})`;
        box.style.backgroundColor = color;
        box.textContent = color;
    });
}

export function showWaiting(myColorDecided) {
    if(!myColorDecided) return;

    if (document.getElementById("waitingText")) return;
    
    const msg = document.createElement("p");
    msg.id = "waitingText";
    msg.textContent = "カラー選択中...";

    opponentDiv.prepend(msg);
}

export function showOpponentPalette(boxes, colors) {
    // "カラー選択中..."削除
    const msg = document.getElementById("waitingText");
    if (msg) msg.remove();

    colors.forEach((color, i) => {
        boxes[i].style.backgroundColor = color;
    });
}

export function showSelectedPalette(boxes, colors, isMe) {
    const selectedText = document.getElementById("selectedPlayer");
    if (selectedText) selectedText.remove();

    // タイトル
    const text = document.createElement("p");
    text.id = "selectedPlayer"
    text.textContent = isMe 
        ? "あなたが選ばれました" 
        : "相手が選ばれました";

    selectedDiv.appendChild(text);

    // カラーボックス
    colors.forEach((color, i) => {
        boxes[i].style.backgroundColor = color;
    });
}
