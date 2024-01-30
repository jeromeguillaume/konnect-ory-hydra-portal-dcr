helm repo add ory https://k8s.ory.sh/helm/charts
helm repo update

helm -n ory install ory \
    --set 'hydra.config.secrets.system={$(LC_ALL=C tr -dc 'A-Za-z0-9' < /dev/urandom | head -c 32 | base64)}' \
    --set 'hydra.config.dsn=postgres://ory:orypass@postgresql:5432/orydb' \
    --set 'hydra.config.urls.self.issuer=http://ory-hydra-public.ory:4444' \
    --set 'hydra.config.urls.login=http://ory-hydra-public.ory:4444/login' \
    --set 'hydra.config.urls.consent=http://ory-hydra-public.ory:4444/consent' \
    --set 'hydra.config.oidc.dynamic_client_registration.enabled=true' \
    --set 'service.public.type=LoadBalancer' \
    --set 'service.admin.type=LoadBalancer' \
    --set 'hydra.dev=true' \
    --set 'hydra.automigration.enabled=true' \
    --set 'maester.enabled=false' \
    ory/hydra

# Create a client_id/client_secret
#curl -v -X POST http://localhost:4445/admin/clients \
#  -H 'Content-Type: application/json' \
#  -H 'Accept: application/json' \
#  -d '{"client_secret": "secret", "grant_types": ["client_credentials"]}'