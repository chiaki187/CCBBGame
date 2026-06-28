// const myPanel = document.getElementById("palette");
// const opponentPanel = document.getElementById("opponent");

// export function playRoulette(isMe, callback){

//     let count = 0;

//     const timer = setInterval(() => {

//         if(count % 2 === 0){
//             myPanel.classList.add("active");
//             opponentPanel.classList.remove("active");
//         }else{
//             opponentPanel.classList.add("active");
//             myPanel.classList.remove("active");
//         }

//         count++;

//     },100);

//     setTimeout(() => {

//         clearInterval(timer);

//         myPanel.classList.remove("active");
//         opponentPanel.classList.remove("active");

//         if(isMe){
//             myPanel.classList.add("active");
//         }else{
//             opponentPanel.classList.add("active");
//         }

//         // 0.5秒後に次の処理へ
//         setTimeout(() => {
//             callback();
//         },500);

//     },2500);
// }

const myPanel = document.getElementById("palette");
const opponentPanel = document.getElementById("opponent");

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function playRoulette(isMe, callback) {

    // 徐々に遅くなる間隔(ms)
    const delays = [
        60, 60, 60, 60,
        80, 80,
        100, 100,
        120,
        150,
        180,
        220,
        280,
        350,
        450,
        600
    ];

    let current = 0;

    for (const delay of delays) {

        if (current === 0) {
            myPanel.classList.add("active");
            opponentPanel.classList.remove("active");
        } else {
            opponentPanel.classList.add("active");
            myPanel.classList.remove("active");
        }

        // 次は反対側へ
        current = 1 - current;

        await sleep(delay);
    }

    // 枠をリセット
    myPanel.classList.remove("active");
    opponentPanel.classList.remove("active");

    // 当選した側で停止
    if (isMe) {
        myPanel.classList.add("active");
    } else {
        opponentPanel.classList.add("active");
    }

    await sleep(500);

    callback();
}