require("dotenv").config();

const PgClient = require("./infrastructure/db/postgres");
const RedisClient = require("./infrastructure/cache/redis");

/* SHARED AUTH (same pattern as other services) */
const JwtVerifier = require("../shared/auth/JwtVerifier");
const authMiddleware = require("../shared/auth/authMiddleware");

/* REPOS */
const PgChatMessageRepo = require("./infrastructure/repositories/PgChatMessageRepo");

/* USE CASES */
const SendGroupMessage = require("./application/useCases/SendGroupMessage");
const ListGroupMessages = require("./application/useCases/ListGroupMessages");

/* GROUP HTTP CLIENT */
const GroupClient = require("./infrastructure/group/GroupClient");

/* MESSAGING */
const GroupEventsConsumer = require("./infrastructure/messaging/GroupEventsConsumer");

/* SOCKET REGISTRY */
const SocketRegistry = require("./interfaces/ws/socketRegistry");

/* CONTROLLER + ROUTES */
const createChatController = require("./interfaces/http/controllers/chatController");
const createChatRoutes = require("./interfaces/http/routes/chatRoutes");

async function createContainer() {
    /* DB */
    const db = new PgClient({
        host: process.env.PGHOST,
        user: process.env.PGUSER,
        password: process.env.PGPASSWORD,
        database: process.env.PGDATABASE,
        port: process.env.PGPORT || 5432
    });

    /* REDIS */
    const redis = new RedisClient({
        host: process.env.REDIS_HOST || "redis",
        port: process.env.REDIS_PORT || 6379
    });
    const cache = await redis.connect();

    /* REPOS */
    const messageRepo = new PgChatMessageRepo(db);

    /* USE CASES (no membershipRepo anymore) */
    const sendGroupMessage = new SendGroupMessage({ messageRepo });
    const listGroupMessages = new ListGroupMessages({ messageRepo });

    /* Group client (membership check once for REST + sockets) */
    const groupClient = new GroupClient({
        baseUrl: process.env.GROUP_SERVICE_URL
    });

    /* Socket registry */
    const socketRegistry = new SocketRegistry();

    /* Consumer (now only needs cache + socketRegistry) */
    const groupEventsConsumer = new GroupEventsConsumer(process.env.RABBITMQ_URL, {
        cache,
        socketRegistry
    });

    /* JWT auth (HTTP) */
    const jwtVerifier = new JwtVerifier({ secret: process.env.JWT_SECRET });
    const auth = authMiddleware(jwtVerifier);

    /* Controller + Router */
    const controller = createChatController({
        listGroupMessages,
        sendGroupMessage,
        groupClient
    });

    const chatRouter = createChatRoutes({
        controller,
        auth
    });

    return {
        repos: { messageRepo },
        useCases: { sendGroupMessage, listGroupMessages },
        clients: { groupClient },
        socketRegistry,
        consumers: { groupEventsConsumer },
        routers: { chatRouter }
    };
}

module.exports = createContainer;
