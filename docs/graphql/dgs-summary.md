# DGS Summary

This document summarizes the DGS added as part of the federated GraphQL layer.

## 1. Shipping DGS

Directory:

```text
src/shipping-dgs
```

Backend called:

```text
http://shipping:50050
```

Exposed operation:

```graphql
shippingQuoteUsd(address: AddressInput!, items: [CartItemInput!]!): Money!
```

Role:

- calculate a shipping quote;
- convert GraphQL inputs into the HTTP payload expected by the Shipping service;
- return a GraphQL `Money` type.

## 2. Product Catalog DGS

Directory:

```text
src/product-catalog-dgs
```

Backend called:

```text
product-catalog:3550
```

Exposed operations:

```graphql
products: [Product!]!
product(id: ID!): Product!
```

Role:

- retrieve the product list;
- retrieve a product by identifier;
- expose the federated `Product` type.

## 3. Currency DGS

Directory:

```text
src/currency-dgs
```

Backend called:

```text
currency:7001
```

Exposed operations:

```graphql
supportedCurrencies: [String!]!
convertCurrency(from: MoneyInput!, toCode: String!): CurrencyMoney!
```

Federated extension:

```graphql
extend type Product @key(fields: "id") {
  id: ID! @external
  priceUsd: ProductMoney! @external
  price(currencyCode: String!): CurrencyMoney!
    @requires(fields: "priceUsd { currencyCode units nanos }")
}
```

Role:

- expose the supported currencies;
- convert a monetary value;
- enrich the `Product` type with a `price(currencyCode)` field.

## 4. Cart DGS

Directory:

```text
src/cart-dgs
```

Backend called:

```text
cart:7070
```

Exposed operations:

```graphql
cart(userId: String!): Cart!
addCartItem(userId: String!, productId: ID!, quantity: Int!): Cart!
emptyCart(userId: String!): Cart!
```

Role:

- retrieve a user cart;
- add a product to the cart;
- empty a cart;
- expose a federated reference to `Product`.

Federation example:

```graphql
cart(userId: "cart-dgs-test-user") {
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

## 5. Recommendation DGS

Directory:

```text
src/recommendation-dgs
```

Backend called:

```text
recommendation:9001
```

Backend protocol:

```text
gRPC
```

Exposed operations:

```graphql
recommendedProductIds(
  userId: String!
  productIds: [ID!]!
  limit: Int = 4
): [ID!]!

recommendedProducts(
  userId: String!
  productIds: [ID!]!
  limit: Int = 4
): [Product!]!
```

Federated reference:

```graphql
type Product @key(fields: "id", resolvable: false) {
  id: ID!
}
```

Role:

- call the gRPC `RecommendationService.ListRecommendations` service;
- retrieve a list of recommended product identifiers;
- expose either product identifiers only or federated references to `Product`;
- let `product-catalog-dgs` resolve the product details;
- allow `currency-dgs` to add a converted price through `price(currencyCode)`.

Federation example:

```graphql
recommendedProducts(
  userId: "recommendation-dgs-test-user"
  productIds: ["OLJCESPC7Z"]
  limit: 4
) {
  id
  name
  priceUsd {
    currencyCode
    units
    nanos
  }
  price(currencyCode: "EUR") {
    currencyCode
    units
    nanos
  }
}
```

This operation demonstrates a chained federation flow:

```text
recommendation-dgs -> product-catalog-dgs -> currency-dgs
```

## 6. Product Reviews DGS

Directory:

```text
src/product-reviews-dgs
```

Backend called:

```text
product-reviews:3551
```

Backend protocol:

```text
gRPC
```

Exposed operations:

```graphql
productReviews(productId: ID!): [ProductReview!]!
averageProductReviewScore(productId: ID!): String!
askProductAiAssistant(productId: ID!, question: String!): String!
```

Federated extension:

```graphql
extend type Product @key(fields: "id") {
  id: ID! @external
  reviews: [ProductReview!]!
  averageReviewScore: String!
  askAiAssistant(question: String!): String!
}
```

Role:

- retrieve the reviews of a product;
- retrieve the average review score of a product;
- query the AI assistant linked to a product;
- enrich the federated `Product` type with reviews, the average score and the product assistant.

Federation example:

```graphql
product(id: "OLJCESPC7Z") {
  id
  name
  priceUsd {
    currencyCode
    units
    nanos
  }
  price(currencyCode: "EUR") {
    currencyCode
    units
    nanos
  }
  reviews {
    username
    description
    score
  }
  averageReviewScore
  askAiAssistant(question: "Is this product useful for beginners?")
}
```

This operation demonstrates federation between:

```text
product-catalog-dgs -> currency-dgs -> product-reviews-dgs
```

## 7. Ad DGS

Directory:

```text
src/ad-dgs
```

Backend called:

```text
ad:9555
```

Backend protocol:

```text
gRPC
```

Exposed operation:

```graphql
ads(contextKeys: [String!]!): [Ad!]!
```

Exposed type:

```graphql
type Ad {
  redirectUrl: String!
  text: String!
}
```

Role:

- call the gRPC `AdService.GetAds` service;
- retrieve advertisements based on a list of context keys;
- expose advertisements through the GraphQL Gateway;
- return a redirect URL and an advertisement text.

Example:

```graphql
query GetAds {
  ads(contextKeys: []) {
    redirectUrl
    text
  }
}
```

This operation allows the `ad` service to be tested through `ad-dgs`.

With `contextKeys: []`, the service may return random advertisements.

## 8. Checkout DGS

Directory:

```text
src/checkout-dgs
```

Backend called:

```text
checkout:5050
```

Backend protocol:

```text
gRPC
```

Exposed operation:

```graphql
placeOrder(input: PlaceOrderInput!): CheckoutOrder!
```

Role:

- expose the checkout flow through a GraphQL mutation;
- call the gRPC `CheckoutService.PlaceOrder` service;
- send the user, currency, address, email and payment information;
- retrieve the order result;
- return the shipping cost, address, ordered items and product references;
- allow `product-catalog-dgs` to resolve product details through federation.

Validated federation example:

```graphql
mutation PlaceOrder {
  placeOrder(input: {
    userId: "checkout-dgs-test-user"
    userCurrency: "EUR"
    address: {
      streetAddress: "1600 Amphitheatre Parkway"
      city: "Mountain View"
      state: "CA"
      country: "United States"
      zipCode: "94043"
    }
    email: "checkout-dgs-test@example.com"
    creditCard: {
      creditCardNumber: "4111111111111111"
      creditCardCvv: 123
      creditCardExpirationYear: 2030
      creditCardExpirationMonth: 12
    }
  }) {
    orderId
    shippingTrackingId
    shippingCost {
      currencyCode
      units
      nanos
    }
    shippingAddress {
      streetAddress
      city
      state
      country
      zipCode
    }
    items {
      item {
        productId
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
      cost {
        currencyCode
        units
        nanos
      }
    }
  }
}
```

This operation demonstrates federation between:

```text
cart-dgs -> checkout-dgs -> checkout -> product-catalog-dgs
```