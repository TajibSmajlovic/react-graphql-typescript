"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserResolver = void 0;
const argon2_1 = __importDefault(require("argon2"));
const uuid_1 = require("uuid");
const type_graphql_1 = require("type-graphql");
const User_1 = require("./../entities/User");
const validateRegister_1 = require("../utils/validation/validateRegister");
const sendEmail_1 = require("../utils/sendEmail");
const constants_1 = require("../utils/constants");
const typeorm_1 = require("typeorm");
let UsernamePasswordInput = class UsernamePasswordInput {
};
__decorate([
    type_graphql_1.Field(),
    __metadata("design:type", String)
], UsernamePasswordInput.prototype, "username", void 0);
__decorate([
    type_graphql_1.Field(),
    __metadata("design:type", String)
], UsernamePasswordInput.prototype, "email", void 0);
__decorate([
    type_graphql_1.Field(),
    __metadata("design:type", String)
], UsernamePasswordInput.prototype, "password", void 0);
UsernamePasswordInput = __decorate([
    type_graphql_1.InputType()
], UsernamePasswordInput);
let FieldError = class FieldError {
};
__decorate([
    type_graphql_1.Field(() => String, { nullable: true }),
    __metadata("design:type", String)
], FieldError.prototype, "field", void 0);
__decorate([
    type_graphql_1.Field(() => String),
    __metadata("design:type", String)
], FieldError.prototype, "message", void 0);
FieldError = __decorate([
    type_graphql_1.ObjectType()
], FieldError);
let UserResponse = class UserResponse {
};
__decorate([
    type_graphql_1.Field(() => [FieldError], { nullable: true }),
    __metadata("design:type", Array)
], UserResponse.prototype, "errors", void 0);
__decorate([
    type_graphql_1.Field(() => User_1.User, { nullable: true }),
    __metadata("design:type", User_1.User)
], UserResponse.prototype, "user", void 0);
UserResponse = __decorate([
    type_graphql_1.ObjectType()
], UserResponse);
let UserResolver = class UserResolver {
    me({ req }) {
        return __awaiter(this, void 0, void 0, function* () {
            if (req.session.userId)
                return yield User_1.User.findOne(req.session.userId);
            return undefined;
        });
    }
    register(options, { req }) {
        return __awaiter(this, void 0, void 0, function* () {
            const errors = validateRegister_1.validateRegister(options.username, options.email, options.password);
            if (errors.length)
                return { errors };
            const hashedPassword = yield argon2_1.default.hash(options.password);
            let user;
            try {
                const responseUser = yield typeorm_1.getConnection()
                    .createQueryBuilder()
                    .insert()
                    .into(User_1.User)
                    .values({
                    username: options.username,
                    email: options.email,
                    password: hashedPassword,
                })
                    .returning("*")
                    .execute();
                user = responseUser.raw[0];
            }
            catch (error) {
                if (error.code === "23505")
                    return {
                        errors: [
                            {
                                field: "username",
                                message: "Username already taken",
                            },
                        ],
                    };
                else
                    return {
                        errors: [
                            {
                                message: "Internal Server Error",
                            },
                        ],
                    };
            }
            req.session.userId = user.id;
            return { user };
        });
    }
    login(usernameOrEmail, password, { req }) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield User_1.User.findOne(usernameOrEmail.includes("@")
                ? { where: { email: usernameOrEmail } }
                : { where: { username: usernameOrEmail } });
            if (!user)
                return {
                    errors: [
                        {
                            field: "usernameOrEmail",
                            message: "usernameOrEmail doesn't exist",
                        },
                    ],
                };
            const isPasswordValid = yield argon2_1.default.verify(user.password, password);
            if (!isPasswordValid)
                return {
                    errors: [
                        {
                            field: "password",
                            message: "Wrong password",
                        },
                    ],
                };
            req.session.userId = user.id;
            return {
                user,
            };
        });
    }
    logout({ req, res }) {
        return new Promise((resolve) => {
            req.session.destroy((err) => {
                res.clearCookie(constants_1.COOKIE_NAME);
                if (err) {
                    resolve(false);
                    return;
                }
                resolve(true);
            });
        });
    }
    forgotPassword(email, { redis }) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield User_1.User.findOne({ where: { email } });
            if (!user)
                return true;
            const token = uuid_1.v4();
            redis.set(`${constants_1.FORGET_PASSWORD_PREFIX}${token}`, user.id, "ex", 1000 * 60 * 10);
            sendEmail_1.sendEmail(email, `<a href="http://localhost:3000/change-password/${token}">reset password</a>`);
            return false;
        });
    }
    changePassword(token, newPassword, { req, redis }) {
        return __awaiter(this, void 0, void 0, function* () {
            if (newPassword.length < 6)
                return {
                    errors: [
                        { field: "newPassword", message: "length must be greater than 2" },
                    ],
                };
            const userId = yield redis.get(`${constants_1.FORGET_PASSWORD_PREFIX}${token}`);
            if (!userId)
                return {
                    errors: [{ field: "token", message: "token expired!" }],
                };
            const user = yield User_1.User.findOne(parseInt(userId));
            if (!user)
                return {
                    errors: [{ field: "newPassword", message: "User no longer exist" }],
                };
            yield User_1.User.update({ id: parseInt(userId) }, { password: yield argon2_1.default.hash(newPassword) });
            yield redis.del(`${constants_1.FORGET_PASSWORD_PREFIX}${token}`);
            req.session.userId = user.id;
            return { user };
        });
    }
};
__decorate([
    type_graphql_1.Query(() => User_1.User, { nullable: true }),
    __param(0, type_graphql_1.Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserResolver.prototype, "me", null);
__decorate([
    type_graphql_1.Mutation(() => UserResponse),
    __param(0, type_graphql_1.Arg("options", () => UsernamePasswordInput)),
    __param(1, type_graphql_1.Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [UsernamePasswordInput, Object]),
    __metadata("design:returntype", Promise)
], UserResolver.prototype, "register", null);
__decorate([
    type_graphql_1.Mutation(() => UserResponse),
    __param(0, type_graphql_1.Arg("usernameOrEmail", () => String)),
    __param(1, type_graphql_1.Arg("password", () => String)),
    __param(2, type_graphql_1.Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], UserResolver.prototype, "login", null);
__decorate([
    type_graphql_1.Mutation(() => Boolean),
    __param(0, type_graphql_1.Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UserResolver.prototype, "logout", null);
__decorate([
    type_graphql_1.Mutation(() => Boolean),
    __param(0, type_graphql_1.Arg("email", () => String)),
    __param(1, type_graphql_1.Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UserResolver.prototype, "forgotPassword", null);
__decorate([
    type_graphql_1.Mutation(() => UserResponse),
    __param(0, type_graphql_1.Arg("token", () => String)),
    __param(1, type_graphql_1.Arg("newPassword", () => String)),
    __param(2, type_graphql_1.Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], UserResolver.prototype, "changePassword", null);
UserResolver = __decorate([
    type_graphql_1.Resolver()
], UserResolver);
exports.UserResolver = UserResolver;
//# sourceMappingURL=user.js.map