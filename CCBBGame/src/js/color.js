
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
