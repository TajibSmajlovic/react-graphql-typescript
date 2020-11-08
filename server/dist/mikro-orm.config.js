"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const Post_1 = require("./entities/Post");
const constants_1 = require("./utils/constants");
exports.default = {
    migrations: {
        path: path_1.default.join(__dirname, "./migrations"),
        pattern: /^[\w-]+\d+\.[tj]s$/,
    },
    user: "postgres",
    password: "postgres",
    dbName: "lireddit",
    type: "postgresql",
    debug: !constants_1.isProduction,
    entities: [Post_1.Post],
};
//# sourceMappingURL=mikro-orm.config.js.map