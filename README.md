# Konnect Portal DCR Handler for Ory Hydra
This repository is an implementation of an HTTP DCR bridge to enable integration between the [Konnect Dev Portal](https://docs.konghq.com/konnect/dev-portal/) and Ory Hydra. The HTTP DCR bridge acts as a proxy and translation layer between Hydra Admin API and DCR applications made in the Konnect Dev Portal.

**Comment**: the Hydra DCR requires to re-use the `registration_access_token` (got on the application creation) for the refresh and the deletion of the application. As there is no way to store the `registration_access_token` in Konnect, we use the Hydra Admin API (port 4445) (and not the Hydra DCR mechanism) to manage the full lifecycle of the Application. The Hydra Admin API has to be secured by the Kong Gateway and, at least, an Authentication mechanism (Bearer token or Basic) configured with the OpenId Connect plugin.

This repository is forked from https://github.com/Kong/konnect-portal-dcr-handler. Please read the [README.md](https://github.com/Kong/konnect-portal-dcr-handler?tab=readme-ov-file) of this repo.

The HTTP DCR bridge is deployed as a serverless solution on AWS Lambda and it's based on a  lightweight [fastify](https://fastify.dev/) Node.js server.

## Prerequisites
### Git clone
Do a git clone of this repository

### Yarn
Install Yarn [^1.22.x](https://classic.yarnpkg.com/lang/en/docs/install)

### Hydra configuration
1) Install Ory Hydra
- You can use the material provided in this repo to deploy Hydra in Kubernetes
- First, create a namespace called `ory`
- Second, install the Database, for instance PostgreSQL: 
```sh
kubectl apply -f ory_install/1-postgresql.yaml
```
- Last, install Ory Server: 
```sh
./ory_install/2-oryHelm.sh
```
2) Hydra - Admin API (port 4445)
- In Konnect, create a Gateway Service and a Route to publish the Hydra Administrative API (port 4445). Example of Route: https://api.client.net/admin-idp
- Secure the Route by enabling the [OpenId Connect Plugin](https://docs.konghq.com/hub/kong-inc/openid-connect/). Enable the `auth_methods` = `client_credentials` or `introspection`
3) Hydra - Public API (port 4444)
- As the Admin API, configure for the Public API a Gateway Service and a Route without Authenticaton.
Example of Route: 
https://api.client.net/public-idp

### Lambda function (first steps)
1) Create the Function
  - Connect to the AWS Console
  - Select the proper region (for instance `eu-central-1`)
  - Create a Lambda function with:
    - name =`konnect-portal-dcr-hydra`
    - runtime = `Node.js 20.x`
    - Advanced settings / Enable function URL = `enabled`

  **Click on Create function**

2) Open the Function
  - Change `Code` / `Runtime settings`: handler = `lambda.handler`
  - Change `Configuration`/`General configuration`: timeout = `10s`
  - Open `Configuration`/`Environment variables` and Edit:
    - HYDRA_ADMIN_API = `<hydra-admin-api-to-be-replaced>` (it's the Hydra Administrative API (4445 port) published through the Kong Gateway, example: https://api.client.net/admin-idp)
    - HYDRA_TOKEN_AUTHN = Bearer token
    - HYDRA_CLIENT_ID = a `client_id` created in Hydra
    - HYDRA_CLIENT_SECRET = the related `client_secret` in Hydra

Choose one of the both AuthN mechanism: Bearer token or client_id/client_secret. The Lambda Function checks the presence of all variables; **so declare all variables even if there is no value**.

**Click on Save**

See the Function URL
![Alt text](/images/3-AWS-Lambda-function.png?raw=true "AWS Lambda - creation")


### Konnect Dev Portal configuration
1) Have a Kong Konnect account
  - You can Start a Free trial at: [konghq.com](https://konghq.com/products/kong-konnect/register)
2) Login to konnect
3) Select Dev Portal / Settings / Application Setup menu and configure with:
  - External identity provider for applications = `HTTP`
  - Issuer = `<hydra-public-api-to-be-replaced>` (example: https://api.client.net/public-idp/.well-known/openid-configuration)
  - HTTP Base URL = `<AWS_Function_url-to-be-replaced>`
  - Scopes = `openid`
  - Consumer claims = `client_id`
  - Auth methods = check `Bearer Access Token` and `Client Credentials Grant`
  - DCR Token = click on `Generate Token` and **store the DCR token**

**Click on Save**
![Alt text](/images/4-Konnect-Application-setup.png?raw=true "Konnect Dev Portal configuration")

### Lambda function (last step)
1) Open the Function
  - Open `Configuration`/`Environment variables` and Edit:
    - KONG_API_TOKENS = `<DCR_token-to-be-replaced>` (see step#3 - Konnect Dev Portal configuration)

**Click on Save**

### S3 Bucket
- Create a S3 bucket and call it for instance `konnect-portal-dcr-hydra`
- The purpose of this bucket is to store the source code of the DCR Handler and to push it in the AWS Lambda Function
- **You don't need to upload** the `lambda-dcr-http.zip` manually: it will be done automatically by the CI workfow
![Alt text](/images/4-AWS-S3-bucket.png?raw=true "AWS S3 bucket")

## Test locally the DCR Handler
Install dependencies
```sh
yarn install --frozen-lockfile
```

Update the `.env` file as explained for Lambda Function

Start local instance
```sh
yarn start
```

The fastify server is started by default on port 3000

1) Create a new Application
- Request: `<DCR_token-to-be-replaced>`, `<portal_id-to-be-replaced>`, `<organization_id-to-be-replaced>` have to be replaced by their proper value. Go on Konnect / Dev Portal to get `portal_id` and `organization_id`
```sh
http POST :3000/ redirect_uris=http://localhost \
    x-api-key:<DCR_token-to-be-replaced> \
    client_name=jegvscode1 \
    application_description=\
    grant_types\[\]=authorization_code \
    grant_types\[\]=refresh_token \
    grant_types\[\]=implicit \
    token_endpoint_auth_method=client_secret_jwt \
    portal_id=<portal_id-to-be-replaced> \
    organization_id=<organization_id-to-be-replaced>
```
- Response:
```sh
HTTP/1.1 201 Created
...
{
    "client_id": "f54b9dc4-ee16-4a99-bfc9-4107ae73d6a4",
    "client_id_issued_at": 1705399806,
    "client_secret": "istHTAPMMFLRDPT83dPfDCHOZH7cLV6V",
    "client_secret_expires_at": 0
}
```
Check on Hydra the creation of this new `client`

2) Refresh a `client_secret` of an Application
- Request:
```sh
http POST :3000/f54b9dc4-ee16-4a99-bfc9-4107ae73d6a4/new-secret x-api-key:<DCR_token-to-be-replaced>
```
- Response:
```sh
HTTP/1.1 200 OK
...
{
    "client_id": "f54b9dc4-ee16-4a99-bfc9-4107ae73d6a4",
    "client_secret": "JJrUI01URnL863GRyTIIsdFeTrkDVbMj"
}
```
Check on Hydra the value of the new `client_secret`

3) Delete an Application
- Request:
```sh
http DELETE :3000/f54b9dc4-ee16-4a99-bfc9-4107ae73d6a4 x-api-key:<DCR_token-to-be-replaced>
```
- Response:
```sh
HTTP/1.1 204 No Content
```
Check on Hydra the deletion of this `client`

## Deploy the DCR Handler to the Lambda Function
- The Git Workflow [ci.yml](.github/workflows/ci.yml) pushes the DCR Handler code in the Lambda Function.
- Prepare and start a `self-hosted` Github Runner: open with the browser your Github repo and select Settings / Actions / Runners and click on `New self-hosted runner` 
- Create Environment secrets: select Settings / Secrets and variables / Environment secrets with:
  - AWS_ROLE_NAME: `<function_arn-to-be-replaced>` (example: `arn:aws:lambda:eu-west-3:162225303348:function:konnect-portal-dcr-hydra`)
  - BUCKET_NAME: `konnect-portal-dcr-hydra`
  - FUNCTION_NAME: `konnect-portal-dcr-hydra`
![Alt text](/images/5-Github-Environment-secrets.png?raw=true "GitHub - Environment secrets")
- Connect to AWS cli (for the `self-hosted` runner)
```sh
aws sso login
```
- Do a Commit & Push of your repo, check in GitHub the green status of your CI workflow

## Test from Konnect Dev Portal the DCR Handler
1) Login to Konnect Dev Portal
2) Click on `My Apps` under your profile name
3) Click on `New App`
![Alt text](/images/6-Konnect-DevPortal-NewApp.png?raw=true "Konnect Dev Portal - New App")
4) Click on `Create`
![Alt text](/images/7-Konnect-DevPortal-NewApp.png?raw=true "Konnect Dev Portal - New client_id/client_secret")
5) Go on Hydra Server and check the new Client
```sh
hydra get client 01c6ea95-7e7a-4d00-92fb-204bbc29b03c --format json-pretty
```
![Alt text](/images/8-Hydra-NewClient.png?raw=true "Hydra - New client")
6) Go on Catalog, Select a Service and Register it to the new App
7) Test access 
- Request:
```sh
http -a "01c6ea95-7e7a-4d00-92fb-204bbc29b03c:I3gV7EE#CUFqMGBI66_ceeyIbAcwJL" :8000/myhttpbin/anything
```
- Response:
```sh
HTTP/1.1 200 OK
...
{
    "args": {},
    "data": "",
    "files": {},
    "form": {},
    "headers": {
        "Accept": "*/*",
        "Authorization": "Bearer ABCDEF...."
    },
    "json": null,
    "method": "GET",
    "url": "https://localhost/anything"
}
```
8) Test the Refresh secret
- Select `My app`
- Select `Refresh secret` menu
![Alt text](/images/9-Konnect-Refresh-secret.png?raw=true "Konnect Dev Portal - Refresh secret")
9) Delete the App
- Select `My app`
- Select `Delete`
![Alt text](/images/10-Konnect-DevPortal-DeleteApp.png?raw=true "Konnect Dev Portal - Delete App")
10) Go on Hydra Server and check that the client is no longer present
```sh
hydra get client 01c6ea95-7e7a-4d00-92fb-204bbc29b03c 
```
![Alt text](/images/11-Hydra-AppDeleted.png?raw=true "Hydra - Deleted App")
