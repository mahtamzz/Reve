const { Server } = require("socket.io");

const JwtVerifier = require("../../../../shared/auth/JwtVerifier");
const socketAuthMiddleware = require("./socketAuth");
const registerChatHandlers = require("./chatHandlers");

module.exports = function createSocketServer(httpServer, container) {
    const io = new Server(httpServer, {
        cors: {
            origin: ["http://localhost:5173", "http://localhost:8080"],
            credentials: true
        }
    });

    const jwtVerifier = new JwtVerifier({ secret: process.env.JWT_SECRET });
    io.use(socketAuthMiddleware(jwtVerifier));

    io.on("connection", (socket) => {
        container.socketRegistry.track(socket);

        registerChatHandlers(io, socket, {
            groupClient: container.clients.groupClient,
            sendGroupMessage: container.useCases.sendGroupMessage,
            listGroupMessages: container.useCases.listGroupMessages
        });
    });

    return io;
};
