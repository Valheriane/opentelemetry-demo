# GraphQL Operations

Les opérations GraphQL de test sont stockées dans :

```text
src/gateway/operations
````

Elles servent à valider manuellement que la Gateway expose correctement les fonctionnalités implémentées par les DGS.

## Commande générique

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

## Fédération Product / Currency

```bash
jq -Rs '{query: .}' src/gateway/operations/get-product-with-converted-price.graphql \
  | curl -s http://localhost:4000/ \
      -H "content-type: application/json" \
      --data-binary @- | jq
```

Cette opération démontre que :

* `product-catalog-dgs` fournit le produit et son prix USD ;
* `currency-dgs` étend le type `Product` ;
* la Gateway assemble la réponse finale.


## Product Reviews

```bash
jq -Rs '{query: .}' src/gateway/operations/get-product-reviews.graphql \
  | curl -s http://localhost:4000/ \
      -H "content-type: application/json" \
      --data-binary @- | jq
`````

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

Ces opérations valident les trois appels gRPC du service `ProductReviewService` et la fédération autour du type `Product`.
