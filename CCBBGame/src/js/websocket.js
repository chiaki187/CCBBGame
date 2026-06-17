let socket;

export function connect(callback) {
    // 現在開いているページのURLから、本番環境かローカル環境かを自動で判別します
    const isProduction = window.location.hostname !== 'localhost';
    
    // 本番環境（Render）なら wss://自分のアプリ名.onrender.com
    // ローカル環境なら ws://localhost:3000
    const socketUrl = isProduction
        ? `wss://${window.location.hostname}` // Render上では自動的にそのアプリのURLになります
        : "ws://localhost:3000";

    socket = new WebSocket(socketUrl);

    socket.onopen = () => {
        console.log("WebSocket接続成功");
    };

    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        callback(data);
    };
    
    // エラーが起きたときにログを出せるように
    socket.onerror = (error) => {
        console.error("WebSocketエラー:", error);
    };
}