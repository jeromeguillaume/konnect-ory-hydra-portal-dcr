"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationPayloadSchema = void 0;
exports.ApplicationPayloadSchema = {
    type: 'object',
    additionalProperties: false,
    properties: {
        redirect_uris: {
            type: 'array',
            items: {
                type: 'string'
            }
        },
        client_name: {
            type: 'string'
        },
        grant_types: {
            type: 'array',
            items: {
                type: 'string'
            }
        },
        token_endpoint_auth_method: {
            type: 'string'
        },
        application_description: {
            type: 'string'
        },
        portal_id: {
            type: 'string',
            format: 'uuid'
        },
        organization_id: {
            type: 'string',
            format: 'uuid'
        }
    },
    required: [
        'redirect_uris',
        'client_name',
        'grant_types',
        'token_endpoint_auth_method',
        'application_description',
        'portal_id',
        'organization_id'
    ]
};
//# sourceMappingURL=ApplicationPayload.js.map