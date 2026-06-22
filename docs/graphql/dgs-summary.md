# DGS Summary

Ce document résume les DGS ajoutés dans le cadre de la couche GraphQL fédérée.

## 1. Shipping DGS

Dossier :

```text
src/shipping-dgs
````

Backend appelé :

```text
http://shipping:50050
```

Opération exposée :

```graphql
shippingQuoteUsd(address: AddressInput!, items: [CartItemInput!]!): Money!
```

Rôle :

* calculer un devis de livraison ;
* convertir les inputs GraphQL en payload HTTP attendu par le service Shipping ;
* retourner un type GraphQL `Money`.

## 2. Product Catalog DGS

Dossier :

```text
src/product-catalog-dgs
```

Backend appelé :

```text
product-catalog:3550
```

Opérations exposées :

```graphql
products: [Product!]!
product(id: ID!): Product!
```

Rôle :

* récupérer la liste des produits ;
* récupérer un produit par identifiant ;
* exposer le type fédéré `Product`.

## 3. Currency DGS

Dossier :

```text
src/currency-dgs
```

Backend appelé :

```text
currency:7001
```

Opérations exposées :

```graphql
supportedCurrencies: [String!]!
convertCurrency(from: MoneyInput!, toCode: String!): CurrencyMoney!
```

Extension fédérée :

```graphql
extend type Product @key(fields: "id") {
  id: ID! @external
  priceUsd: ProductMoney! @external
  price(currencyCode: String!): CurrencyMoney!
    @requires(fields: "priceUsd { currencyCode units nanos }")
}
```

Rôle :

* exposer les devises supportées ;
* convertir une valeur monétaire ;
* enrichir le type `Product` avec un champ `price(currencyCode)`.

## 4. Cart DGS

Dossier :

```text
src/cart-dgs
```

Backend appelé :

```text
cart:7070
```

Opérations exposées :

```graphql
cart(userId: String!): Cart!
addCartItem(userId: String!, productId: ID!, quantity: Int!): Cart!
emptyCart(userId: String!): Cart!
```

Rôle :

* récupérer un panier utilisateur ;
* ajouter un produit au panier ;
* vider un panier ;
* exposer une référence fédérée vers `Product`.

Exemple de fédération :

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

