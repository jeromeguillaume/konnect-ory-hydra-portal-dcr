"use strict";
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
exports.handler = void 0;
const aws_lambda_1 = __importDefault(require("@fastify/aws-lambda"));
const app_1 = require("./app");
function createHandler() {
    return __awaiter(this, void 0, void 0, function* () {
        const app = yield (0, app_1.init)();
        return (0, aws_lambda_1.default)(app);
    });
}
const fastifyHandler = createHandler();
const handler = (event, context) => __awaiter(void 0, void 0, void 0, function* () {
    const proxy = yield fastifyHandler;
    return proxy(event, context);
});
exports.handler = handler;
//# sourceMappingURL=lambda.js.map