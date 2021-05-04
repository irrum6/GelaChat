const express = require("express");
const { readSync } = require("fs");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

const crypto = require("crypto");

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const rooms = new Map();

app.get("/", (req, res) => {
    res.sendFile(`${__dirname}/index.html`);
});

app.get("/getcha", (req, res) => {
    res.sendFile(`${__dirname}/getcha.html`);
});

app.get("/room/:id", (req, res) => {

    let { id } = req.params;
    let { pass } = req.query;

    let wrong = false;
    // compare passwords
    if (!rooms.has(req.params.id)) {
        res.sendFile(`${__dirname}/views/404.html`);
        return;
    }

    let ro = rooms.get(id);

    if (ro.pass !== pass) {
        res.sendFile(`${__dirname}/views/wrong.html`);
        return;
    }

    res.sendFile(`${__dirname}/views/room.html`);
});

app.get("/create", (req, res) => {
    res.sendFile(`${__dirname}/views/create.html`);
});

app.post("/create", (req, res) => {
    let { name, pass } = req.body;
    // console.log(name, pass);

    const room = { name, pass };
    let n = crypto.randomInt(0, 65536);

    while (rooms.has(n)) {
        // if by magic that id exist already
        n = crypto.randomInt(0, 65536);
    }
    // some cast
    rooms.set(String(n), room);
    let url = `/room/${n}?pass=${pass}#${n}`;

    res.redirect(url);
});

io.on("connection", (socket) => {
    console.log("An user connected");

    socket.on('chat', ({ msg, name }) => {
        // console.log('message: ' + msg);
        io.emit('chat', { msg, name });
    });
    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
    socket.on("typing", (name) => {
        io.emit('typing', name);
    });
    socket.on('connected', (name) => {
        io.emit("connected", name);
    });

    socket.on("join", ({roomid, pass}) => {
        let ro = rooms.get(roomid);
        console.log(Date.now(),roomid, pass);
        // record atempt
        if (ro.pass == pass) {
            socket.join(roomid);
        }
    });

    // room posting
    socket.on("post", (name, room) => {

    });

    // secure room posting
    socket.on("schat", (room,{ msg, name }) => {
        io.to(room).emit('schat', { msg, name });
    });
    socket.on('clrs', (room,{ msg, name }) => {
        io.to(room).emit('clrs', { msg, name });
    });
});

const port = process.env.PORT || 3000;

server.listen(port, () => {
    console.log(`listening on port:${port}`);
});

// -- თქვენი სახელი და გვარი.
// - გელა ვარ, გელავა
// -- გელა გელავა?
// - გელა ვარ, გელავა
// -- გელავარ გელავა?
// - გელა ვარ, ბიჭო, გელავა, რა არის აქ გაუგებარი.
// -- გელავა გელავა?
// - გელა გელავა.
// -- აჰ,კარგით, გასაგებია. საიდან ხართ?
// - გელათიდან.
// -- გელათში სად ცხოვრობთ?
// - გელაშვილის ქუჩაზე.
// -- რომელი გელაშვილის ქუჩა?
// - გელა გელაშვილის ქუჩა 420.
// -- რამხელა ქუჩაა?!
// - დიდი არაა, უბრალოდ, 400-იდან დაიწყეს დანომვრა. ქუჩის ბოლოშია ჩემი სახლი.
// -- კარგით, ეხლა ეგ ყველაფერი სრულად.
// - გელა ვარ, გელავა. გელათიდან. გელა გელაშვილის ქუჩაზე ვცხოვრობ.
// -- იქნებ, უფრო ფორმალურად.
// - მე ვარ გელა გელავა. ვცხოვრობ გელათში, გელა გელაშვილის ქუჩაზე.
// -- ნომერი გამოგრჩა.
// - მე ვარ გელა გელავა. ვცხოვრობ გელათში, გელა გელაშვილის ქუჩა 420-ზე სახლში.
// -- თავისუფალი ხართ.