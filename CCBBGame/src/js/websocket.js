let socket;


export function connect(callback){


    socket = new WebSocket(
        "ws://localhost:3000"
    );


    socket.onopen = ()=>{

        console.log(
            "WebSocket接続成功"
        );

    };


    socket.onmessage=(event)=>{


        const data =
        JSON.parse(event.data);


        callback(data);

    };

}