# Frontend Operation Analysis Guide

This document describes the method used to identify the frontend operations of the OpenTelemetry Astronomy Shop and map them to the federated GraphQL Gateway.

It is intended as a recovery guide if the project needs to be continued later, especially for adding new DGS or progressively connecting the frontend to the GraphQL Gateway.

## Goal

The goal is not to understand the entire OpenTelemetry Demo codebase at once.

The goal is to follow the current access path used by the frontend, identify the backend service involved, and define the equivalent GraphQL operation exposed through the Gateway.

The analysis follows this path:

```text
current frontend
   ↓
src/frontend/pages/api
   ↓
src/frontend/gateways
   ↓
pb/demo.proto or HTTP backend service
   ↓
existing backend services
```

The target architecture follows this path:

```text
frontend or GraphQL client
   ↓
GraphQL Gateway
   ↓
DGS
   ↓
existing backend services
```

## Scope of the Analysis

The frontend currently interacts with several backend services through internal API routes and gateway classes.

The main services relevant for the GraphQL Federation layer are:

```text
product-catalog
currency
cart
shipping
recommendation
product-reviews
ad
checkout
```

Other services in the repository may be ignored unless they are directly involved in a frontend operation.

## Files to Inspect First

To map an operation, start from the frontend API layer:

```text
src/frontend/pages/api
```

Then follow the call to the frontend gateway layer:

```text
src/frontend/gateways
```

For gRPC services, use the protobuf contract:

```text
pb/demo.proto
```

For HTTP services, inspect the gateway class and the service route used by the frontend.

Useful commands:

```bash
find src/frontend/pages/api -type f | sort
```

```bash
find src/frontend/gateways -type f | sort
```

```bash
grep -n "service .*Service" pb/demo.proto
```

```bash
grep -n "rpc " pb/demo.proto
```

## Analysis Method

For each frontend feature, fill one mapping line with:

```text
frontend endpoint
frontend gateway class
backend service
backend method or route
future GraphQL operation
```

Example format:

| Feature | Frontend API file | Current gateway | Backend | Backend operation | GraphQL operation |
|---|---|---|---|---|---|
| List products | `src/frontend/pages/api/products/index.ts` | `ProductCatalog.gateway.ts` | `product-catalog` | gRPC `ListProducts` | `products` |
| Product details | `src/frontend/pages/api/products/[productId]/index.ts` | `ProductCatalog.gateway.ts` | `product-catalog` | gRPC `GetProduct` | `product(id)` |
| Get cart | `src/frontend/pages/api/cart.ts` | `Cart.gateway.ts` | `cart` | gRPC `GetCart` | `cart(userId)` |
| Add cart item | `src/frontend/pages/api/cart.ts` | `Cart.gateway.ts` | `cart` | gRPC `AddItem` | `addCartItem(...)` |
| Empty cart | `src/frontend/pages/api/cart.ts` | `Cart.gateway.ts` | `cart` | gRPC `EmptyCart` | `emptyCart(userId)` |
| Shipping quote | `src/frontend/pages/api/shipping.ts` | `Shipping.gateway.ts` | `shipping` | HTTP `POST /get-quote` | `shippingQuoteUsd(...)` |

## gRPC Services

For gRPC services, the main source of truth is:

```text
pb/demo.proto
```

The protobuf file defines:

```text
service name
RPC method name
request type
response type
shared message types
```

The frontend gateway files show how the existing frontend already calls these services.

Example path for Product Catalog:

```text
src/frontend/pages/api/products/index.ts
   ↓
src/frontend/gateways/rpc/ProductCatalog.gateway.ts
   ↓
pb/demo.proto
   ↓
product-catalog service
```

## HTTP Services

For HTTP services, inspect the HTTP gateway used by the frontend.

Example path for Shipping:

```text
src/frontend/pages/api/shipping.ts
   ↓
src/frontend/gateways/http/Shipping.gateway.ts
   ↓
shipping service
```

The useful backend route for the shipping quote is:

```text
POST http://shipping:50050/get-quote
```

The GraphQL operation implemented for this use case is:

```graphql
shippingQuoteUsd(address: AddressInput!, items: [CartItemInput!]!): Money!
```

## Shipping DGS Notes

The current frontend route is:

```text
GET /api/shipping
```

It receives:

```text
itemList
currencyCode
address
```

Internally, the frontend calls the Shipping service using:

```text
POST http://shipping:50050/get-quote
```

The Shipping service expects a payload using `snake_case`.

GraphQL input:

```json
{
  "productId": "OLJCESPC7Z",
  "quantity": 1
}
```

Shipping service payload:

```json
{
  "product_id": "OLJCESPC7Z",
  "quantity": 1
}
```

GraphQL address input:

```json
{
  "streetAddress": "1600 Amphitheatre Parkway",
  "city": "Mountain View",
  "state": "CA",
  "country": "United States",
  "zipCode": "94043"
}
```

Shipping service payload:

```json
{
  "street_address": "1600 Amphitheatre Parkway",
  "city": "Mountain View",
  "state": "CA",
  "country": "United States",
  "zip_code": "94043"
}
```

The first implementation only exposes the USD shipping cost returned by the Shipping service.

Currency conversion is handled separately by `currency-dgs`.

## Implementation Rule

When adding or reviewing a DGS, use this rule:

```text
Only inspect a backend service if a frontend operation actually uses it.
```

This avoids getting lost in the full microservices repository.

## Checklist for Adding a New DGS

1. Identify the frontend API route in `src/frontend/pages/api`.
2. Find the gateway class used by this route in `src/frontend/gateways`.
3. Identify whether the backend call is gRPC or HTTP.
4. For gRPC, inspect `pb/demo.proto`.
5. For HTTP, inspect the route and payload expected by the backend.
6. Define the GraphQL operation.
7. Define the GraphQL types and inputs.
8. Implement the resolver.
9. Add the DGS to Docker Compose.
10. Add the DGS URL to the GraphQL Gateway configuration.
11. Add a `.graphql` operation in `src/gateway/operations`.
12. Test the operation through `localhost:4000`.
13. Update the documentation.

## Useful Test Command

```bash
jq -Rs '{query: .}' src/gateway/operations/<operation>.graphql \
  | curl -s http://localhost:4000/ \
      -H "content-type: application/json" \
      --data-binary @- | jq
```

## Recovery Notes

If the project is resumed later, start by checking:

```bash
git status
git branch --show-current
```

Then verify that the GraphQL stack still starts correctly:

```bash
make demo-graphql
```

Finally, run the end-to-end test:

```bash
./scripts/test-gateway-e2e.sh
```

If the test passes, the Gateway and the eight implemented DGS are still functional.