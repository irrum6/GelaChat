const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

const crypto = require("crypto");

app.use(express.urlencoded({ extended: true }));
app.use(express.json());


const te = require("./tengine");
te.setViewsDirectory("views", true);

const rooms = new Map();

app.get("/", (req, res) => {
    te.render(req, res, "index");
});

app.get("/getcha", (req, res) => {
    te.render(req, res, "getcha");
});

app.get("/room/:id", (req, res) => {

    let { id } = req.params;
    let { pass } = req.query;

    if (!rooms.has(req.params.id)) {
        res.redirect("/404");
        return;
    }

    let ro = rooms.get(id);

    if (ro.pass !== pass) {
        te.render(req, res, "wrong");
        return;
    }
    te.render(req, res, "room");
});

app.get("/create", (req, res) => {
    let { not } = req.query;
    if (not === "1") {
        res.sendFile(`${__dirname}/views/create.html`);
        return;
    }
    te.render(req, res, "create");

});

app.post("/create", (req, res) => {
    let { name, pass } = req.body;

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

app.get("/404", (req, res) => {
    te.render(req, res, "404");
});

app.get("*", (req, res) => {
    te.default(req, res);
})

io.on("connection", (socket) => {
    socket.on('chat', ({ msg, name }) => {
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

    socket.on("join", ({ roomid, pass }) => {
        let ro = rooms.get(roomid);
        // record atempt
        if (ro.pass == pass) {
            socket.join(roomid);
        }
    });

    // secure room posting
    socket.on("schat", (room, { msg, name }) => {
        io.to(room).emit('schat', { msg, name });
    });
    socket.on('clrs', (room, { msg, name }) => {
        io.to(room).emit('clrs', { msg, name });
    });
});

const port = process.env.PORT || 3000;

server.listen(port, () => {
    console.log(`listening on port:${port}`);
});