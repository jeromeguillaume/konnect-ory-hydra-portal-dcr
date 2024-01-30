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
exports.init = void 0;
const fastify_1 = __importDefault(require("fastify"));
const handler_1 = require("./handlers/handler");
const env_1 = __importDefault(require("@fastify/env"));
const axios_1 = __importDefault(require("axios"));
function init(config = {}) {
    return __awaiter(this, void 0, void 0, function* () {
        const app = (0, fastify_1.default)({ logger: true });
        yield app.register(env_1.default, {
            schema: {
                type: 'object',
                required: ['HYDRA_TOKEN_AUTHN', 'HYDRA_CLIENT_ID', 'HYDRA_CLIENT_SECRET', 'HYDRA_ADMIN_API', 'KONG_API_TOKENS'],
                properties: {
                    KONG_API_TOKENS: {
                        type: 'string',
                        separator: ','
                    },
                    HYDRA_TOKEN_AUTHN: { type: 'string' },
                    HYDRA_CLIENT_ID: { type: 'string' },
                    HYDRA_CLIENT_SECRET: { type: 'string' },
                    HYDRA_ADMIN_API: { type: 'string' }
                }
            },
            dotenv: false
        });
        if (!config.httpClient) {
            config.httpClient = axios_1.default.create({ baseURL: app.config.HYDRA_ADMIN_API });
        }
        app.decorate('httpClient', config.httpClient);
        app.register(handler_1.DCRHandlers);
        app.setErrorHandler((error, request, reply) => {
            request.log.error(error);
            if (error.validation) {
                reply.status(400).send({
                    error: 'Bad Request',
                    error_description: error.validation
                });
            }
            else {
                reply.status(error.statusCode || 400).send({
                    error: error.name,
                    error_description: error.message
                });
            }
        });
        return app;
    });
}
exports.init = init;
if (require.main === module) {
    (() => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const app = yield init();
            yield app.listen({ port: 3000 });
            app.log.info('Server started');
        }
        catch (error) {
            console.error('Error starting the application:', error);
            process.exit(1);
        }
    }))();
}
//# sourceMappingURL=app.js.map