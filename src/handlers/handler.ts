import type { FastifyInstance, FastifyReply, FastifyRequest, RegisterOptions } from 'fastify'
import type { ApplicationResponse } from '../schemas/ApplicationResponse'
import type { ApplicationPayload } from '../schemas/ApplicationPayload'

import { ApplicationPayloadSchema } from '../schemas/ApplicationPayload'
import { EventHookSchema } from '../schemas/EventHook'

import { Buffer } from 'node:buffer';

/**
 * DCRHandlers registers the fastify plugin for Konnect DCR handlers in the fastify instance
 * it implements all the required routes and also protects the endpoints for with the `x-api-key` header
 */
export function DCRHandlers (fastify: FastifyInstance, _: RegisterOptions, next: (err?: Error) => void): void {
  fastify.addHook('preHandler', (request, reply, done) => {
    const apiKey = request.headers['x-api-key'] as string

    if (!apiKey || !fastify.config.KONG_API_TOKENS.includes(apiKey)) {
      reply.code(401).send({ error: 'Wrong API-Key', error_description: 'wrong x-api-key header' })
    } else {
      done()
    }
  })

  //---------------------------------------
  // Create a new 'client' / 'Application'
  //---------------------------------------
  fastify.route({
    url: '/',
    method: 'POST',
    schema: {
      body: ApplicationPayloadSchema
    },
    handler: async function (request: FastifyRequest<{ Body: ApplicationPayload }>, reply: FastifyReply): Promise<FastifyReply> {
      const grantTypes: string[] = []
      const responseTypes: string[] = []

      if (request.body.grant_types.includes('client_credentials') || request.body.grant_types.includes('bearer')) {
        grantTypes.push('client_credentials')
      }

      responseTypes.push('code')
      responseTypes.push('id_token')
      responseTypes.push('token')
      
      const password = createPassword (30, true, true)
      
      const hydraPayload = {
        client_secret: password,
        client_name: request.body.client_name,
        redirect_uris: request.body.redirect_uris,
        response_types: responseTypes,
        grant_types: request.body.grant_types,
        token_endpoint_auth_method: 'client_secret_basic',
        access_token_strategy: 'jwt'
      }

      const headers = getAuthHeaders(fastify.config.HYDRA_TOKEN_AUTHN, fastify.config.HYDRA_CLIENT_ID, fastify.config.HYDRA_CLIENT_SECRET)
      const url = 'admin/clients'
      console.log("Hydra request, url='POST %s', headers=%j, body=%j", url, headers, hydraPayload)
      const response = await fastify.httpClient.post(
        url,
        hydraPayload,
        { headers }
      )
      console.log("Hydra response, code=%d, data=%j", response.status, response.data)
      const application: ApplicationResponse = {
        client_id: response.data.client_id,
        client_id_issued_at: response.data.created_at,
        client_secret: response.data.client_secret,
        client_secret_expires_at: response.data.client_secret_expires_at
      }
      return reply.code(201).send(application)
    }
  })

  //-----------------------------------
  // Delete a 'client' / 'Application'
  //-----------------------------------
  fastify.route({
    url: '/:application_id',
    method: 'DELETE',
    handler: async function (request: FastifyRequest<{ Params: { application_id: string } }>, reply: FastifyReply): Promise<FastifyReply> {
      
      const headers = getAuthHeaders(fastify.config.HYDRA_TOKEN_AUTHN, fastify.config.HYDRA_CLIENT_ID, fastify.config.HYDRA_CLIENT_SECRET)
      const url = `admin/clients/${request.params.application_id}`
      console.log("Hydra request, url='DELETE %s', headers=%j", url, headers)
      const response = await fastify.httpClient.delete(
        url,
        { headers }
      )
      console.log("Hydra response, code=%d, data=%j", response.status, response.data)
      return reply.code(204).send()
    }
  })

  //-----------------------------------------------------------
  // Refresh the 'client_secret' of a 'client' / 'Application'
  //-----------------------------------------------------------
  fastify.route({
    url: '/:application_id/new-secret',
    method: 'POST',
    handler: async function (request: FastifyRequest<{ Params: { application_id: string } }>, reply: FastifyReply): Promise<FastifyReply> {
      
      const headers = getAuthHeaders(fastify.config.HYDRA_TOKEN_AUTHN, fastify.config.HYDRA_CLIENT_ID, fastify.config.HYDRA_CLIENT_SECRET)
      let url = `admin/clients/${request.params.application_id}`
      
      const password = createPassword (30, true, true)
      const hydraPayload = [
        {
          "op": "replace",
		      "path": "/client_secret",
		      "value": password
        }
      ]
      
      console.log("Hydra request, url='PATCH /%s', headers=%j, body=%j", url, headers, hydraPayload)
      // Call the PATCH 'admin/clients' which updates the secret
      const response = await fastify.httpClient.patch(
        url,
        hydraPayload,
        { headers }
      )
      console.log("Hydra response, code=%d, data=%j", response.status, response.data)
      
      return reply.code(200).send({
        client_id: request.params.application_id,
        client_secret: response.data.client_secret
      })
    }
  })

  fastify.route({
    url: '/:application_id/event-hook',
    method: 'POST',
    schema: {
      body: EventHookSchema
    },
    handler: async function (request: FastifyRequest<{ Params: { application_id: string }, Body: { EventHook } }>, reply: FastifyReply): Promise<FastifyReply> {
      const url = `/${request.params.application_id}/event-hook`
      console.log("Hydra request, url='POST /%s', body=%j", url, request.body)
      return reply.code(200).send()
    }
  })

  next()
}

//-----------------------------------------------------------------------
// Add the AuthN header to communicate with Hydra Admin API
// 2 types of AuthN are allowed: Bearer or Basic
// 'Authorization: Bearer <token>'
// 'Authorization: Basic base64(client_id:client_secret)'
//-----------------------------------------------------------------------
function getAuthHeaders (token: string, client_id: string, client_secret: string) {
  let headers = {
    Accept: 'application/json',
  'Content-Type': 'application/json'
  }
  if (token)
  {
    headers ["Authorization"] = 'Bearer ' + token
  }
  else if (client_id)
  {
    const data = client_id + ':' + client_secret
    const buff = Buffer.from(data)
    const base64data = buff.toString('base64')
    headers ["Authorization"] = 'Basic ' + base64data
  }
  return headers
}


//------------------------------------------------------------
// Generate a password
// Thanks to https://blog.logrocket.com/author/samuelmartins/
//------------------------------------------------------------
const alpha = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
const integers = "0123456789";
const exCharacters = "!@#$^*_-=";
const createPassword = (length: number, hasNumbers: boolean, hasSymbols: boolean) => {
    let chars = alpha;
    if (hasNumbers) {
        chars += integers;
    }
    if (hasSymbols) {
        chars += exCharacters;
    }
    return generatePassword(length, chars);
};

const generatePassword = (length: number, chars: string) => {
    let password = "";
    for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
};