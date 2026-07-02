
# GraphQL Federation - OpenTelemetry Astronomy Shop

This folder documents the federated GraphQL layer added to the OpenTelemetry Astronomy Shop project.

The goal of this contribution is to add a federated GraphQL Gateway between the existing frontend and the existing backend microservices, without modifying the backend services.

The Gateway exposes a unified GraphQL interface on top of several DGS, each one responsible for a specific business domain.

## Current Status

The contribution currently includes:

- a federated Apollo Gateway;
- 8 functional DGS;
- a Docker Compose integration through `compose.extras.yaml`;
- GraphQL test operations in `src/gateway/operations`.

## Implemented DGS

| DGS | Port | Backend called | Protocol | Status |
|---|---:|---|---|---|
| `shipping-dgs` | 4004 | `shipping:50050` | HTTP | Functional |
| `product-catalog-dgs` | 4005 | `product-catalog:3550` | gRPC | Functional |
| `currency-dgs` | 4006 | `currency:7001` | gRPC | Functional |
| `cart-dgs` | 4007 | `cart:7070` | gRPC | Functional |
| `recommendation-dgs` | 4008 | `recommendation:9001` | gRPC | Functional |
| `product-reviews-dgs` | 4009 | `product-reviews:3551` | gRPC | Functional |
| `graphql-gateway` | 4000 | GraphQL DGS | GraphQL Federation | Functional |
| `ad-dgs` | 4010 | `ad:9555` | gRPC | Functional |
| `checkout-dgs` | 4011 | `checkout:5050` | gRPC | Functional |

## Important Points

The Gateway exposes a single GraphQL schema composed from the different DGS.

Several federation use cases between DGS are currently demonstrated:

1. `cart-dgs` exposes cart items with product references, and `product-catalog-dgs` resolves the product details.
2. `currency-dgs` extends the `Product` type to expose a converted price through `price(currencyCode: String!)`.
3. `recommendation-dgs` returns product references, then `product-catalog-dgs` and `currency-dgs` enrich the final response.

This allows clients, for example, to request a cart with its products, a product with its converted price, or recommendations with product details and converted prices.

## Local Startup

From the project root:

```bash
docker compose -f compose.yaml -f compose.extras.yaml up -d --build \
  shipping-dgs \
  product-catalog-dgs \
  currency-dgs \
  cart-dgs \
  recommendation-dgs \
  product-reviews-dgs \
  ad-dgs \
  checkout-dgs \
  graphql-gateway
````

The Gateway is then available at:

```text
http://localhost:4000/
```

## Health Checks

```bash
curl http://localhost:4004/health
curl http://localhost:4005/health
curl http://localhost:4006/health
curl http://localhost:4007/health
curl http://localhost:4008/health
curl http://localhost:4009/health
curl http://localhost:4010/health
curl http://localhost:4011/health
```

## GraphQL Test Operations

The test operations are stored in:

```text
src/gateway/operations
```

They can be executed with:

```bash
jq -Rs '{query: .}' src/gateway/operations/<operation>.graphql \
  | curl -s http://localhost:4000/ \
      -H "content-type: application/json" \
      --data-binary @- | jq
```
