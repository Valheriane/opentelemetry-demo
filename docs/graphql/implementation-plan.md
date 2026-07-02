# GraphQL Federation Implementation Plan

This document describes the implementation strategy used to introduce a federated GraphQL Gateway into the OpenTelemetry Astronomy Shop project.

It explains how the project was approached progressively, starting from the existing frontend behavior, then adding a Gateway and several Domain Graph Services (DGS) without modifying the existing backend services.

## 1. Project Approach

The OpenTelemetry Astronomy Shop is a large microservices application. The objective of this contribution was not to rewrite or deeply modify the existing services.

The goal was to add an intermediate GraphQL Federation layer between the existing frontend and the backend microservices.

The implementation followed this principle:

```text
understand the existing frontend calls
   ↓
map them to backend services
   ↓
design equivalent GraphQL operations
   ↓
implement one DGS at a time
   ↓
compose the DGS through the GraphQL Gateway
```

This approach made it possible to work incrementally while keeping the existing application functional.

## 2. Initial Codebase Exploration

The first step was to identify how the current frontend communicates with the backend services.

The main files and folders inspected were:

```text
src/frontend/pages/api
src/frontend/gateways
src/frontend/services
pb/demo.proto
compose.yaml
compose.extras.yaml
```

The frontend API routes were used as the main entry point because they represent the operations currently used by the application.

The existing frontend gateways were then inspected to understand whether each backend call used:

```text
gRPC
HTTP
```

For gRPC services, the protobuf contract was used as the main source of information:

```text
pb/demo.proto
```

For HTTP services, the existing frontend gateway implementation was used to identify the backend route and expected payload.

## 3. Frontend Operation Mapping

Before implementing the Gateway and the DGS, the frontend operations were mapped to their backend services.

The mapping followed this structure:

| Frontend feature | Frontend API route | Existing gateway | Backend service | Future GraphQL operation |
|---|---|---|---|---|
| List products | `src/frontend/pages/api/products/index.ts` | `ProductCatalog.gateway.ts` | `product-catalog` | `products` |
| Get product details | `src/frontend/pages/api/products/[productId]/index.ts` | `ProductCatalog.gateway.ts` | `product-catalog` | `product(id)` |
| Get cart | `src/frontend/pages/api/cart.ts` | `Cart.gateway.ts` | `cart` | `cart(userId)` |
| Add item to cart | `src/frontend/pages/api/cart.ts` | `Cart.gateway.ts` | `cart` | `addCartItem(...)` |
| Empty cart | `src/frontend/pages/api/cart.ts` | `Cart.gateway.ts` | `cart` | `emptyCart(userId)` |
| List currencies | `src/frontend/pages/api/currency.ts` | `Currency.gateway.ts` | `currency` | `supportedCurrencies` |
| Convert money | frontend currency gateway | `Currency.gateway.ts` | `currency` | `convertCurrency(...)` |
| Shipping quote | `src/frontend/pages/api/shipping.ts` | `Shipping.gateway.ts` | `shipping` | `shippingQuoteUsd(...)` |
| Recommendations | `src/frontend/pages/api/recommendations.ts` | `Recommendations.gateway.ts` | `recommendation` | `recommendedProducts(...)` |
| Product reviews | `src/frontend/pages/api/product-reviews` | product review services | `product-reviews` | `productReviews(...)` |
| Product AI assistant | `src/frontend/pages/api/product-ask-ai-assistant` | product review services | `product-reviews` | `askProductAiAssistant(...)` |
| Advertisements | `src/frontend/pages/api/data.ts` | `Ad.gateway.ts` | `ad` | `ads(contextKeys)` |
| Checkout | `src/frontend/pages/api/checkout.ts` | `Checkout.gateway.ts` | `checkout` | `placeOrder(...)` |

This mapping was used as the basis for the GraphQL schema and the DGS implementation.

## 4. Minimal MVP Strategy

The implementation was designed to start with a small and stable MVP before extending the federation layer.

The first target scope was:

```text
graphql-gateway
product-catalog-dgs
currency-dgs
cart-dgs
shipping-dgs
```

These services were selected because they cover core e-commerce features while remaining manageable:

| DGS | Reason |
|---|---|
| `product-catalog-dgs` | Core service for product listing and product details |
| `currency-dgs` | Small gRPC service useful for validating simple queries |
| `cart-dgs` | Central business service with both queries and mutations |
| `shipping-dgs` | HTTP-based service, useful to validate integration with a non-gRPC backend |

This MVP already demonstrated the main concepts required for the project:

```text
GraphQL queries
GraphQL mutations
gRPC backend calls
HTTP backend calls
federated Product references
Gateway composition
Docker integration
```

## 5. Progressive Implementation Phases

### Phase 1 — Product Catalog DGS

The first DGS implemented was `product-catalog-dgs`.

Its purpose was to expose product-related operations:

```graphql
products: [Product!]!
product(id: ID!): Product!
```

This DGS owns the federated `Product` type:

```graphql
type Product @key(fields: "id") {
  id: ID!
  name: String!
  description: String!
  picture: String
  priceUsd: ProductMoney!
  categories: [String!]!
}
```

This first step made it possible to validate a basic gRPC-backed GraphQL subgraph.

### Phase 2 — GraphQL Gateway

After the first DGS was functional, the GraphQL Gateway was added.

The Gateway composes the DGS schemas and exposes a single GraphQL endpoint:

```text
http://localhost:4000/
```

At this stage, the Gateway was intentionally kept simple and only responsible for composing subgraphs.

### Phase 3 — Currency DGS

The second DGS implemented was `currency-dgs`.

It exposes currency operations:

```graphql
supportedCurrencies: [String!]!
convertCurrency(from: MoneyInput!, toCode: String!): CurrencyMoney!
```

It also extends the federated `Product` type:

```graphql
extend type Product @key(fields: "id") {
  id: ID! @external
  priceUsd: ProductMoney! @external
  price(currencyCode: String!): CurrencyMoney!
    @requires(fields: "priceUsd { currencyCode units nanos }")
}
```

This step demonstrated field-level enrichment through federation.

### Phase 4 — Cart DGS

The `cart-dgs` was then added to expose cart operations:

```graphql
cart(userId: String!): Cart!
addCartItem(userId: String!, productId: ID!, quantity: Int!): Cart!
emptyCart(userId: String!): Cart!
```

This DGS does not own product details. Instead, it returns product references that are resolved by `product-catalog-dgs`.

This allowed the Gateway to resolve queries such as:

```graphql
cart(userId: "demo-user") {
  items {
    quantity
    product {
      id
      name
      priceUsd {
        currencyCode
        units
        nanos
      }
    }
  }
}
```

This was the first strong federation use case of the project.

### Phase 5 — Shipping DGS

The `shipping-dgs` was implemented to validate integration with an HTTP backend service.

It exposes:

```graphql
shippingQuoteUsd(address: AddressInput!, items: [CartItemInput!]!): Money!
```

The DGS translates GraphQL inputs into the HTTP payload expected by the Shipping service.

For example, GraphQL input fields such as:

```text
streetAddress
zipCode
productId
```

are converted to the backend payload format:

```text
street_address
zip_code
product_id
```

The first implementation returns the shipping quote in USD. Currency conversion is handled separately by `currency-dgs`.

## 6. Extended DGS Implementation

After the MVP was stable, the implementation was extended with additional DGS to cover more of the frontend behavior.

### Recommendation DGS

The `recommendation-dgs` exposes product recommendation operations:

```graphql
recommendedProductIds(...)
recommendedProducts(...)
```

It returns product references that can then be enriched by:

```text
product-catalog-dgs
currency-dgs
```

This demonstrates chained federation:

```text
recommendation-dgs -> product-catalog-dgs -> currency-dgs
```

### Product Reviews DGS

The `product-reviews-dgs` exposes product review operations:

```graphql
productReviews(productId: ID!): [ProductReview!]!
averageProductReviewScore(productId: ID!): String!
askProductAiAssistant(productId: ID!, question: String!): String!
```

It also extends the `Product` type with:

```graphql
reviews
averageReviewScore
askAiAssistant(question)
```

This allows product details to be enriched with reviews and AI assistant features.

### Ad DGS

The `ad-dgs` exposes contextual advertisements through:

```graphql
ads(contextKeys: [String!]!): [Ad!]!
```

It calls the existing gRPC `AdService.GetAds` backend service.

### Checkout DGS

The `checkout-dgs` was implemented last because it represents the most complete business flow.

It exposes:

```graphql
placeOrder(input: PlaceOrderInput!): CheckoutOrder!
```

This mutation calls the existing Checkout service and returns order information, shipping information and product references.

It demonstrates a more complete federated flow:

```text
cart-dgs -> checkout-dgs -> checkout -> product-catalog-dgs
```

## 7. Final Implemented Scope

The final contribution contains:

```text
graphql-gateway
shipping-dgs
product-catalog-dgs
currency-dgs
cart-dgs
recommendation-dgs
product-reviews-dgs
ad-dgs
checkout-dgs
```

The implemented DGS cover the main backend services used by the frontend:

```text
Product Catalog
Currency
Cart
Shipping
Recommendation
Product Reviews
Ad
Checkout
```

## 8. Docker Integration

Each DGS and the GraphQL Gateway were integrated into Docker Compose through:

```text
compose.extras.yaml
```

The GraphQL stack can be started with:

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
```

A Makefile command is also available to start the full GraphQL demo scenario:

```bash
make demo-graphql
```

## 9. Validation Strategy

The Gateway and DGS were validated with individual GraphQL operation files stored in:

```text
src/gateway/operations
```

Each file contains one query or mutation used to test a specific feature.

The generic test command is:

```bash
jq -Rs '{query: .}' src/gateway/operations/<operation>.graphql \
  | curl -s http://localhost:4000/ \
      -H "content-type: application/json" \
      --data-binary @- | jq
```

The project also includes an end-to-end test script:

```bash
./scripts/test-gateway-e2e.sh
```

This script validates a complete user journey through the federated GraphQL Gateway:

```text
catalog browsing
product details
product reviews
recommendations
advertisements
shipping quote
add to cart
complete checkout
```

## 10. Development Rules Used

The implementation followed these rules:

```text
one DGS at a time
one query or mutation at a time
one manual test before moving forward
one commit after each stable step
```

The backend services were not modified.

Each DGS acts as an adapter between the federated GraphQL schema and an existing backend service.

The Gateway remains responsible for schema composition, while domain-specific logic stays inside the relevant DGS.

## 11. How to Resume or Extend the Project

To resume the project later, start by checking the Git state:

```bash
git status
git branch --show-current
```

Then start the GraphQL stack:

```bash
make demo-graphql
```

Run the end-to-end validation script:

```bash
./scripts/test-gateway-e2e.sh
```

If the E2E test passes, the Gateway and the eight implemented DGS are functional.

To add a new operation or extend an existing DGS:

1. identify the frontend feature or backend capability;
2. locate the related frontend API route;
3. inspect the existing frontend gateway;
4. identify the backend method or route;
5. update the DGS schema;
6. implement or update the resolver;
7. add or update the GraphQL operation file in `src/gateway/operations`;
8. test through the Gateway;
9. update the documentation.

## 12. Summary

The project was implemented progressively to reduce risk and keep the system testable at every step.

The final architecture introduces a federated GraphQL layer above the existing backend services, while preserving the original microservices.

The Gateway now provides a unified GraphQL entry point for the main operations currently used by the frontend.