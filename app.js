const express    = require("express"),
      app        = express(),
      bodyParser = require("body-parser"), 
      mongoose   = require("mongoose");

//Mongoose
mongoose.connect("mongodb://localhost/guttaChat", {useNewUrlParser: true});

mongoose.connection.once("open", ()=>{
    console.log("Connection to db 'guttaChat' was successful!");
}).on("error", error=>{
    console.log("Connection error: " + error);
});

// SCHEMA SETUP
let messageSchema = new mongoose.Schema({
    text: String,
    name: String,
    created_date: {type:Date, default:Date.now}
});

let message = mongoose.model("message", messageSchema);

let userSchema = new mongoose.Schema({
    name: String,
    ip: String
});

let user = mongoose.model("user", userSchema);

// message.create({
//     text: "Første melding :P"
// }, (err, newMessage)=>{
//     if(err) {
//         console.log(err);
//     } else {
//         console.log(newMessage);
//     }
// });

let connectedArr = [];

//Express
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.set("view engine", "ejs");
port = "800"; // Port to listen on

app.get("/", (req, res)=>{
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate"); // HTTP 1.1.
    res.setHeader("Pragma", "no-cache"); // HTTP 1.0.
    res.setHeader("Expires", "0"); // Proxies.
    res.render("main");
});

app.get("/messages/:name", (req, res)=>{
    let ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    if(connectedArr.some(item => item.ip === ip)) {

        try {
            let index = connectedArr.map(function (img) { return img.value; }).indexOf(ip);
            connectedArr[index].last = new Date();
        } catch {

        }
      

    } else if(ip !== "::ffff:127.0.0.1" && ip !== "::1") {
        connectedArr.push({ip: ip, last: new Date(), name: req.params.name});
       
    }
    message.find({}, (err, allMessages)=>{
        if(err) {
            console.log(err);
        } else {
            res.send({messages:allMessages, connectedUsers: connectedArr});
        }
    });

});

function checkIfConnected() {
    
    for(const usr of connectedArr) {
        let xs = new Date();
        if((xs - usr.last) >= 3250) {
            let index = connectedArr.map(function (img) { return img.value; }).indexOf(usr.last);

            connectedArr.splice(index, 1);
        }
    }

    setTimeout(checkIfConnected, 100);
} checkIfConnected();

app.post("/", (req, res)=>{


    message.create({
        text: req.body.newChat,
        name: req.body.nameVal
    }, (err, newMessage) => {
        if (err) {
            console.log(err);
        } else {
            res.redirect("/");
        }
    });
    
});

app.listen(port, ()=>{console.log("Express is listening on port: " + port)});