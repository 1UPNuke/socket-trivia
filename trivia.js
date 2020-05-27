'use strict';
const fetch = require("node-fetch");
const URL = require('url').URL;

class Category{
    constructor(name, id){
        this.name = name;
        this.id = id;
    }
}

class Player{
    constructor(name, health, id=0, isHost = false){
        this.name = name;
        this.health = health;
        this.isHost = isHost;
        this.id = id;
        this.score = 0;
    }
}

class Question{
    constructor(question, correct, answers, startTime){
        this.question = question;
        this.correct = correct;
        this.answers = answers;
        this.startTime = startTime;
    }
}

//Private variables
var _token;
var _rootURL = new URL("https://opentdb.com/");

module.exports=class Trivia{
    constructor(){
        this.players = [];
        this.categories = [new Category("All", 0)];
    }

    //Run this before doing anything else
    async init(){
        //Return a promise and wait until everything is fetched to resolve
        return new Promise(async (resolve, reject)=>{
            //Fetch categories
            await fetch(_rootURL+"api_category.php")
                .then(response => response.json())
                .then((data)=>{
                    //Loop through categories
                    for(let category of data.trivia_categories)
                    {
                        //Append to the category list as Category objects
                        let c = new Category(category.name, category.id).clean();
                        this.categories.push(c);
                    }
                }
            );
            console.log(this.categories);
            //Fetch token for use with the API to not get repeat questions
            await fetch(_rootURL+"api_token.php?command=request")
                .then(response => response.json())
                .then(data => _token = data.token);
            console.log(_token);
            //Resolve to continue execution
            resolve();
        });
    }

    async getQuestion(category)
    {
        //Define temporary variable to store the question
        let question;
        //Return a promise and wait until question has been fetched to resolve
        return new Promise(async (resolve, reject)=>{
            //Construct the request URL
            let reqURL = new URL("api.php", _rootURL);
            reqURL.searchParams.set("amount", 1);
            reqURL.searchParams.set("type", "multiple");
            _token ? reqURL.searchParams.set("token", _token) :null;
            category.id!=0 ? reqURL.searchParams.set("category", category) :null;

            //Fetch the question
            await fetch(reqURL)
                .then(response => response.json())
                .then((data)=>{
                    //Take the first question, as we are only fetching one
                    let q = data.results[0];
                    //Make the question into a Question object
                    question = new Question(
                        q.question,
                        q.correct_answer,
                        shuffle([q.correct_answer, ...q.incorrect_answers]),
                        new Date()
                    );
                }
            );
            //Save the question, with the correct answer, and resolve it
            this.currentQuestion = question;
            resolve(question);
        });
    }

    addPlayer(name, health, id){
        if(!isAlphaNumeric(name))
        {
            console.error("Name must be alphanumeric!");
            return -1;
        }
        //If player is the first to join, make them the host.
        if(this.players.length == 0)
        {
            this.players.push(new Player(name, health, id, true));
        }
        //Otherwise make them a normal player.
        else
        {
            this.players.push(new Player(name, health, id));
        }
        //Return the index of the new player
        return(this.players.length-1);
    }

    answerQuestion(playerID, answer, question=null){
        //If question wasn't defined, use the current one
        if(!question)
        {
            question = this.currentQuestion;
        }
        if(answer == question.correct)
        {
            //Add score to the player based on the time it took them to answer
            this.getPlayerByID(playerID).score += Math.floor(30000/(new Date()-question.startTime));
            return true;
        }
        else
        {
            //Take away health from the player
            this.getPlayerByID(playerID).health--;
            return false
        }
    }

    getPlayerByID(id){
        //Loop through all the players
        for(let player of players)
        {
            if(player.id == id)
            {
                return player;
            }
        }
        //Return null if no player was found
        return null;
    }
}

//Function to pseudo-randomly shuffle an array
function shuffle(a) {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
}

Category.prototype.clean = function(){
    //Remove unspecific category titles
    this.name = this.name.replace("Entertainment: ", "").replace("Science: ", "");
    return this;
}

function isAlphaNumeric(str){
    return str.match(/^[0-9a-zA-Z]+$/i);
};