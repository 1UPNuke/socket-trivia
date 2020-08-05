"use strict";

const express = require("express");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const host = process.env.HOST || "localhost"
const port = process.env.PORT || 3000;
const Trivia = require("./trivia.js");
var game = new Trivia();
game.init().then(()=>{
    game.getQuestion(game.categories[0]).then((question)=>{
        console.log(question);
    });

    app.use(express.static(__dirname + "/public"));

    io.on("connection", ()=>{
        socket.on("join", (data)=>{
            let joinIndex = game.addPlayer(data.name, socket.id,  5);
            if(joinIndex > 0)
            {
                io.to(socket.id).emit("joined", {isHost:game.players[joinIndex].isHost});
            }
            else
            {
                io.to(socket.id).emit("error", {message:"Joining game failed, are you sure your name is alphanumeric?"});
            }
        });
        socket.on("answer", (data) => {
            socket.emit("answered", {correct: game.answerQuestion(socket.id, data), player: game.getPlayerByID(socket.id).name});
        });
    });

    http.listen(port, () => console.log("Listening on " + host + ":" + port));
});