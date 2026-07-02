# GraphQL Gateway End-to-End Test

This document describes the end-to-end test script used to validate the main user journey through the federated GraphQL Gateway.

## Objective

The script checks that the GraphQL Gateway is able to orchestrate the different DGS of the project through a complete scenario:

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

## Script Used

```bash
./scripts/test-gateway-e2e.sh
```

By default, the script uses:

```text
Gateway: http://localhost:4000/
Product: OLJCESPC7Z
```

A unique user identifier is automatically generated on each run in order to avoid conflicts with previous carts.

## Running the Test

Before running the script, the Docker stack must be started with the Gateway and the required DGS.

```bash
./scripts/test-gateway-e2e.sh
```

It is also possible to override the Gateway URL:

```bash
GATEWAY_URL=http://localhost:4000/ ./scripts/test-gateway-e2e.sh
```

Or the tested product:

```bash
PRODUCT_ID=OLJCESPC7Z ./scripts/test-gateway-e2e.sh
```

## Validated Journey

The script executes the following steps:

1. retrieve the product list;
2. read an enriched product details page;
3. convert the price to EUR;
4. retrieve product reviews;
5. call the product AI assistant;
6. retrieve recommendations;
7. retrieve contextual advertisements;
8. calculate a shipping quote;
9. add the product to the cart;
10. place an order through `placeOrder`.

## Validated DGS

The script validates the following flow:

```text
product-catalog-dgs -> currency-dgs -> product-reviews-dgs -> recommendation-dgs -> ad-dgs -> shipping-dgs -> cart-dgs -> checkout-dgs
```

## Expected Result

On success, the script displays:

```text
E2E TEST PASSED
```

It also returns:

```text
Order ID
Tracking ID
Number of ordered items
```

This test provides global proof that the federated GraphQL Gateway works correctly and is properly integrated with the eight implemented DGS.

## End-to-End Test

A test script validates a complete user journey through the GraphQL Gateway:

```bash
./scripts/test-gateway-e2e.sh
```

## Running Through the Makefile

The complete scenario can be launched with:

```bash
make demo-graphql
```

## Full Demo With Frontend

A complete demo command is also available:

```bash
make demo-full-graphql
```

This command starts the full OpenTelemetry Demo stack with the GraphQL Gateway, waits for the frontend, waits for the GraphQL Gateway, and then runs the GraphQL end-to-end test.

It validates both access points:

```text
Frontend UI: http://localhost:8080
GraphQL Gateway: http://localhost:4000/
```