# GraphQL Operations

The GraphQL test operations are stored in:

```text
src/gateway/operations
```

They are used to manually validate that the Gateway correctly exposes the features implemented by the DGS.

## Generic Command

```bash
jq -Rs '{query: .}' src/gateway/operations/<operation>.graphql \
  | curl -s http://localhost:4000/ \
      -H "content-type: application/json" \
      --data-binary @- | jq
```

## Shipping

```bash
jq -Rs '{query: .}' src/gateway/operations/get-shipping-quote-usd.graphql \
  | curl -s http://localhost:4000/ \
      -H "content-type: application/json" \
      --data-binary @- | jq
```

## Product Catalog

```bash
jq -Rs '{query: .}' src/gateway/operations/list-products.graphql \
  | curl -s http://localhost:4000/ \
      -H "content-type: application/json" \
      --data-binary @- | jq
```

```bash
jq -Rs '{query: .}' src/gateway/operations/get-product.graphql \
  | curl -s http://localhost:4000/ \
      -H "content-type: application/json" \
      --data-binary @- | jq
```

## Currency

```bash
jq -Rs '{query: .}' src/gateway/operations/list-supported-currencies.graphql \
  | curl -s http://localhost:4000/ \
      -H "content-type: application/json" \
      --data-binary @- | jq
```

```bash
jq -Rs '{query: .}' src/gateway/operations/convert-currency.graphql \
  | curl -s http://localhost:4000/ \
      -H "content-type: application/json" \
      --data-binary @- | jq
```

## Cart

```bash
jq -Rs '{query: .}' src/gateway/operations/add-cart-item.graphql \
  | curl -s http://localhost:4000/ \
      -H "content-type: application/json" \
      --data-binary @- | jq
```

```bash
jq -Rs '{query: .}' src/gateway/operations/get-cart.graphql \
  | curl -s http://localhost:4000/ \
      -H "content-type: application/json" \
      --data-binary @- | jq
```

```bash
jq -Rs '{query: .}' src/gateway/operations/get-cart-with-products.graphql \
  | curl -s http://localhost:4000/ \
      -H "content-type: application/json" \
      --data-binary @- | jq
```

```bash
jq -Rs '{query: .}' src/gateway/operations/empty-cart.graphql \
  | curl -s http://localhost:4000/ \
      -H "content-type: application/json" \
      --data-binary @- | jq
```

## Product / Currency Federation

```bash
jq -Rs '{query: .}' src/gateway/operations/get-product-with-converted-price.graphql \
  | curl -s http://localhost:4000/ \
      -H "content-type: application/json" \
      --data-binary @- | jq
```

This operation demonstrates that:

- `product-catalog-dgs` provides the product and its USD price;
- `currency-dgs` extends the `Product` type;
- the Gateway assembles the final response.

## Product Reviews

```bash
jq -Rs '{query: .}' src/gateway/operations/get-product-reviews.graphql \
  | curl -s http://localhost:4000/ \
      -H "content-type: application/json" \
      --data-binary @- | jq
```

```bash
jq -Rs '{query: .}' src/gateway/operations/get-average-product-review-score.graphql \
  | curl -s http://localhost:4000/ \
      -H "content-type: application/json" \
      --data-binary @- | jq
```

```bash
jq -Rs '{query: .}' src/gateway/operations/ask-product-ai-assistant.graphql \
  | curl -s http://localhost:4000/ \
      -H "content-type: application/json" \
      --data-binary @- | jq
```

```bash
jq -Rs '{query: .}' src/gateway/operations/get-product-with-reviews.graphql \
  | curl -s http://localhost:4000/ \
      -H "content-type: application/json" \
      --data-binary @- | jq
```

```bash
jq -Rs '{query: .}' src/gateway/operations/get-product-with-reviews-and-ai.graphql \
  | curl -s http://localhost:4000/ \
      -H "content-type: application/json" \
      --data-binary @- | jq
```

These operations validate the three gRPC calls of the `ProductReviewService` and the federation around the `Product` type.

## Ad

```bash
jq -Rs '{query: .}' src/gateway/operations/get-ads.graphql \
  | curl -s http://localhost:4000/ \
      -H "content-type: application/json" \
      --data-binary @- | jq
```

This operation validates the call to the `ad` service through `ad-dgs`.

With `contextKeys: []`, the service may return random advertisements.

## Checkout

Before placing an order, a cart must be prepared for the same user.

```bash
jq -Rs '{query: .}' src/gateway/operations/prepare-checkout-cart.graphql \
  | curl -s http://localhost:4000/ \
      -H "content-type: application/json" \
      --data-binary @- | jq
```

Then run the order mutation:

```bash
jq -Rs '{query: .}' src/gateway/operations/place-order.graphql \
  | curl -s http://localhost:4000/ \
      -H "content-type: application/json" \
      --data-binary @- | jq
```

This operation validates the federated flow:

```text
cart-dgs -> checkout-dgs -> checkout -> product-catalog-dgs
```