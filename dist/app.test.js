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
const app_1 = require("./app");
const mockAxios = jest.genMockFromModule('axios');
let app;
describe('dcr handlers', () => {
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        app = yield (0, app_1.init)({ httpClient: mockAxios });
    }));
    afterEach(() => __awaiter(void 0, void 0, void 0, function* () {
        jest.clearAllMocks();
        yield app.close();
    }));
    describe('Create', () => {
        it('succeed', () => __awaiter(void 0, void 0, void 0, function* () {
            const payload = {
                redirect_uris: [
                    'https://example.com'
                ],
                client_name: 'test',
                grant_types: [
                    'authorization_code', 'refresh_token', 'implicit'
                ],
                token_endpoint_auth_method: 'client_secret_post',
                application_description: 'disisatest',
                portal_id: '426ac0a7-aeb6-4043-a404-c4bfe24f2705',
                organization_id: '426ac0a7-aeb6-4043-a404-c4bfe24f2706'
            };
            jest.spyOn(mockAxios, 'post').mockResolvedValueOnce({
                data: {
                    client_id: 'id',
                    client_id_issued_at: 1700825336,
                    client_secret: 'secret',
                    client_secret_expires_at: 0
                },
                status: 201
            });
            const resp = yield app.inject({
                method: 'POST',
                url: '/',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-KEY': app.config.KONG_API_TOKENS[0]
                },
                payload
            });
            expect(resp.statusCode).toEqual(201);
            expect(resp.body).toEqual(JSON.stringify({
                client_id: 'id',
                client_id_issued_at: 1700825336,
                client_secret: 'secret',
                client_secret_expires_at: 0
            }));
            expect(mockAxios.post).toHaveBeenCalledTimes(1);
            yield app.close();
        }));
        it('fails because of a wrong API token', () => __awaiter(void 0, void 0, void 0, function* () {
            const payload = {
                redirect_uris: [
                    'https://example.com'
                ],
                client_name: 'test',
                grant_types: [
                    'authorization_code', 'refresh_token', 'implicit'
                ],
                token_endpoint_auth_method: 'client_secret_post',
                application_description: 'disisatest',
                portal_id: '426ac0a7-aeb6-4043-a404-c4bfe24f2705',
                organization_id: '426ac0a7-aeb6-4043-a404-c4bfe24f2706'
            };
            const resp = yield app.inject({
                method: 'POST',
                url: '/',
                headers: {
                    'Content-Type': 'application/json'
                },
                payload
            });
            expect(resp.statusCode).toEqual(401);
            expect(resp.body).toEqual(JSON.stringify({ error: 'Wrong API-Key', error_description: 'wrong x-api-key header' }));
            expect(mockAxios.post).not.toHaveBeenCalled();
            yield app.close();
        }));
        it('fails because of a wrong payload', () => __awaiter(void 0, void 0, void 0, function* () {
            const payload = {
                client_name: 'test',
                grant_types: [
                    'authorization_code', 'refresh_token', 'implicit'
                ],
                token_endpoint_auth_method: 'client_secret_post',
                application_description: 'disisatest',
                portal_id: '426ac0a7-aeb6-4043-a404-c4bfe24f2705',
                organization_id: '426ac0a7-aeb6-4043-a404-c4bfe24f2706'
            };
            const resp = yield app.inject({
                method: 'POST',
                url: '/',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-KEY': app.config.KONG_API_TOKENS[0]
                },
                payload
            });
            expect(resp.statusCode).toEqual(400);
            const parsedBody = JSON.parse(resp.body);
            expect(parsedBody.error_description[0].params.missingProperty).toBe('redirect_uris');
            expect(mockAxios.post).not.toHaveBeenCalled();
            yield app.close();
        }));
    });
    describe('Delete', () => {
        it('succeed', () => __awaiter(void 0, void 0, void 0, function* () {
            jest.spyOn(mockAxios, 'delete').mockResolvedValueOnce({ status: 200 });
            const resp = yield app.inject({
                method: 'DELETE',
                url: '/someId',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-KEY': app.config.KONG_API_TOKENS[0]
                }
            });
            expect(resp.statusCode).toEqual(204);
            expect(mockAxios.delete).toHaveBeenCalledTimes(1);
        }));
        it('succeed with both api key', () => __awaiter(void 0, void 0, void 0, function* () {
            jest.spyOn(mockAxios, 'delete').mockResolvedValueOnce({ status: 200 });
            const resp = yield app.inject({
                method: 'DELETE',
                url: '/someId',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-KEY': app.config.KONG_API_TOKENS[1]
                }
            });
            expect(resp.statusCode).toEqual(204);
            expect(mockAxios.delete).toHaveBeenCalledTimes(1);
        }));
        it('fails because of a wrong API token', () => __awaiter(void 0, void 0, void 0, function* () {
            const resp = yield app.inject({
                method: 'DELETE',
                url: '/someId',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            expect(resp.statusCode).toEqual(401);
            expect(resp.body).toEqual(JSON.stringify({ error: 'Wrong API-Key', error_description: 'wrong x-api-key header' }));
            expect(mockAxios.delete).not.toHaveBeenCalled();
        }));
    });
    describe('Refresh Secret', () => {
        it('succeed', () => __awaiter(void 0, void 0, void 0, function* () {
            jest.spyOn(mockAxios, 'post').mockResolvedValueOnce({
                data: {
                    client_secret: 'secret'
                },
                status: 200
            });
            const app = yield (0, app_1.init)({ httpClient: mockAxios });
            const resp = yield app.inject({
                method: 'POST',
                url: '/someID/new-secret',
                headers: {
                    'X-API-KEY': app.config.KONG_API_TOKENS[0]
                }
            });
            expect(resp.statusCode).toEqual(200);
            expect(resp.body).toEqual(JSON.stringify({
                client_id: 'someID',
                client_secret: 'secret'
            }));
            expect(mockAxios.post).toHaveBeenCalledTimes(1);
        }));
        it('fails because of a wrong API token', () => __awaiter(void 0, void 0, void 0, function* () {
            const app = yield (0, app_1.init)({ httpClient: mockAxios });
            const resp = yield app.inject({
                method: 'POST',
                url: '/someID/new-secret'
            });
            expect(resp.statusCode).toEqual(401);
            expect(resp.body).toEqual(JSON.stringify({ error: 'Wrong API-Key', error_description: 'wrong x-api-key header' }));
            expect(mockAxios.post).not.toHaveBeenCalled();
        }));
    });
    describe('EventHook', () => {
        it('succeed on update', () => __awaiter(void 0, void 0, void 0, function* () {
            const payload = {
                event_type: 'update_application',
                client_id: 'id',
                application_id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
                application_name: 'name',
                application_description: 'description',
                portal_id: '3fa85f64-5717-4562-b3fc-2c963f66afa7',
                organization_id: '3fa85f64-5717-4562-b3fc-2c963f66afa8'
            };
            const resp = yield app.inject({
                method: 'POST',
                url: '/someId/event-hook',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-KEY': app.config.KONG_API_TOKENS[0]
                },
                payload
            });
            expect(resp.statusCode).toEqual(200);
        }));
        it('succeed on add registration', () => __awaiter(void 0, void 0, void 0, function* () {
            const payload = {
                event_type: 'add_registration',
                client_id: 'id',
                audience: 'audience',
                api_product_version_id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
                application_id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
                application_name: 'name',
                application_description: 'description',
                portal_id: '3fa85f64-5717-4562-b3fc-2c963f66afa7',
                organization_id: '3fa85f64-5717-4562-b3fc-2c963f66afa8'
            };
            const resp = yield app.inject({
                method: 'POST',
                url: '/someId/event-hook',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-KEY': app.config.KONG_API_TOKENS[0]
                },
                payload
            });
            console.log(resp);
            expect(resp.statusCode).toEqual(200);
        }));
        it('succeed on remove registration', () => __awaiter(void 0, void 0, void 0, function* () {
            const payload = {
                event_type: 'remove_registration',
                client_id: 'id',
                audience: 'audience',
                api_product_version_id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
                application_id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
                application_name: 'name',
                application_description: 'description',
                portal_id: '3fa85f64-5717-4562-b3fc-2c963f66afa7',
                organization_id: '3fa85f64-5717-4562-b3fc-2c963f66afa8'
            };
            const resp = yield app.inject({
                method: 'POST',
                url: '/someId/event-hook',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-KEY': app.config.KONG_API_TOKENS[0]
                },
                payload
            });
            console.log(resp);
            expect(resp.statusCode).toEqual(200);
        }));
        it('fails because of a wrong API token', () => __awaiter(void 0, void 0, void 0, function* () {
            const payload = {
                event_type: 'update_application',
                client_id: 'id',
                application_id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
                application_name: 'name',
                application_description: 'description',
                portal_id: '3fa85f64-5717-4562-b3fc-2c963f66afa7',
                organization_id: '3fa85f64-5717-4562-b3fc-2c963f66afa8'
            };
            const resp = yield app.inject({
                method: 'POST',
                url: '/someId/event-hook',
                headers: {
                    'Content-Type': 'application/json'
                },
                payload
            });
            expect(resp.statusCode).toEqual(401);
            expect(resp.body).toEqual(JSON.stringify({ error: 'Wrong API-Key', error_description: 'wrong x-api-key header' }));
        }));
        it('fails because of a wrong payload', () => __awaiter(void 0, void 0, void 0, function* () {
            const payload = {
                client_id: 'id',
                application_id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
                application_name: 'name',
                application_description: 'description',
                portal_id: '3fa85f64-5717-4562-b3fc-2c963f66afa7',
                organization_id: '3fa85f64-5717-4562-b3fc-2c963f66afa8'
            };
            const resp = yield app.inject({
                method: 'POST',
                url: '/someId/event-hook',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-KEY': app.config.KONG_API_TOKENS[0]
                },
                payload
            });
            expect(resp.statusCode).toEqual(400);
            const parsedBody = JSON.parse(resp.body);
            expect(parsedBody.error_description[0].params.missingProperty).toBe('event_type');
        }));
    });
});
//# sourceMappingURL=app.test.js.map