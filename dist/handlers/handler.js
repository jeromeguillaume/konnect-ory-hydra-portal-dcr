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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DCRHandlers = void 0;
const ApplicationPayload_1 = require("../schemas/ApplicationPayload");
const EventHook_1 = require("../schemas/EventHook");
const node_buffer_1 = require("node:buffer");
function getAdminDomain(domain) {
    return domain.replace('/realms/', '/admin/realms/');
}
function DCRHandlers(fastify, _, next) {
    fastify.addHook('preHandler', (request, reply, done) => {
        const apiKey = request.headers['x-api-key'];
        if (!apiKey || !fastify.config.KONG_API_TOKENS.includes(apiKey)) {
            reply.code(401).send({ error: 'Wrong API-Key', error_description: 'wrong x-api-key header' });
        }
        else {
            done();
        }
    });
    fastify.route({
        url: '/',
        method: 'POST',
        schema: {
            body: ApplicationPayload_1.ApplicationPayloadSchema
        },
        handler: function (request, reply) {
            return __awaiter(this, void 0, void 0, function* () {
                const grantTypes = [];
                const responseTypes = [];
                if (request.body.grant_types.includes('client_credentials') || request.body.grant_types.includes('bearer')) {
                    grantTypes.push('client_credentials');
                }
                responseTypes.push('code');
                responseTypes.push('id_token');
                responseTypes.push('token');
                const hydraPayload = {
                    client_secret: 'mysecret',
                    client_name: request.body.client_name,
                    redirect_uris: request.body.redirect_uris,
                    response_types: responseTypes,
                    grant_types: request.body.grant_types,
                    token_endpoint_auth_method: 'client_secret_basic',
                    access_token_strategy: 'jwt'
                };
                const headers = getHeaders(fastify.config.HYDRA_TOKEN_AUTHN);
                const url = 'admin/clients';
                console.log("Hydra request, url='POST /%s', headers=%j, body=%j", url, headers, hydraPayload);
                const response = yield fastify.httpClient.post(url, hydraPayload, { headers });
                console.log("Hydra response, code=%d, data=%j", response.status, response.data);
                const application = {
                    client_id: response.data.client_id,
                    client_id_issued_at: response.data.client_id_issued_at,
                    client_secret: response.data.client_secret,
                    client_secret_expires_at: response.data.client_secret_expires_at
                };
                return reply.code(201).send(application);
            });
        }
    });
    fastify.route({
        url: '/:application_id',
        method: 'DELETE',
        handler: function (request, reply) {
            return __awaiter(this, void 0, void 0, function* () {
                const accessToken = yield getAccessToken(fastify, fastify.config.HYDRA_CLIENT_ID, fastify.config.HYDRA_CLIENT_SECRET);
                const headers = getHeaders(accessToken);
                const url = `clients-registrations/default/${request.params.application_id}`;
                console.log("Hydra request, url='DELETE %s', headers=%j", url, headers);
                const response = yield fastify.httpClient.delete(url, { headers });
                console.log("Hydra response, code=%d, data=%j", response.status, response.data);
                return reply.code(204).send();
            });
        }
    });
    fastify.route({
        url: '/:application_id/new-secret',
        method: 'POST',
        handler: function (request, reply) {
            return __awaiter(this, void 0, void 0, function* () {
                const accessToken = yield getAccessToken(fastify, fastify.config.HYDRA_CLIENT_ID, fastify.config.HYDRA_CLIENT_SECRET);
                const headers = getHeaders(accessToken);
                let url = `clients/${request.params.application_id}/client-secret`;
                console.log("Hydra request, url='POST %s', headers=%j", url, headers);
                let response = yield fastify.httpClient.post(new URL(url, getAdminDomain(fastify.config.HYDRA_ADMIN_API)).toString(), {}, { headers });
                console.log("Hydra response, code=%d, data=%j", response.status, response.data);
                url = `clients/${request.params.application_id}/client-secret`;
                console.log("Hydra request, url='POST %s', headers=%j", url, headers);
                response = yield fastify.httpClient.get(new URL(url, getAdminDomain(fastify.config.HYDRA_ADMIN_API)).toString(), { headers });
                console.log("Hydra response, code=%d, data=%j", response.status, response.data);
                return reply.code(200).send({
                    client_id: request.params.application_id,
                    client_secret: response.data.value
                });
            });
        }
    });
    fastify.route({
        url: '/:application_id/event-hook',
        method: 'POST',
        schema: {
            body: EventHook_1.EventHookSchema
        },
        handler: function (request, reply) {
            return __awaiter(this, void 0, void 0, function* () {
                var url = `/${request.params.application_id}/event-hook`;
                console.log("Hydra request, url='POST /%s', body=%j", url, request.body);
                return reply.code(200).send();
            });
        }
    });
    next();
}
exports.DCRHandlers = DCRHandlers;
function getHeaders(token) {
    return {
        Authorization: 'Bearer ' + token,
        accept: 'application/json',
        'Content-Type': 'application/json'
    };
}
function getAuthBasicHeaders(client_id, client_secret) {
    var data = client_id + ':' + client_secret;
    var buff = node_buffer_1.Buffer.from(data);
    var base64data = buff.toString('base64');
    return {
        Authorization: 'Basic ' + base64data,
        accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded;'
    };
}
function getAccessToken(fastify, client_id, client_secret) {
    return __awaiter(this, void 0, void 0, function* () {
        const headers = getAuthBasicHeaders(client_id, client_secret);
        const response = yield fastify.httpClient.post('protocol/openid-connect/token', { grant_type: "client_credentials" }, { headers });
        console.log(response.data);
        return response.data.access_token;
    });
}
//# sourceMappingURL=handler.js.map