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

## 5. Recommendation DGS

Dossier :

```text
src/recommendation-dgs
```

Backend appelé :

```text
recommendation:9001
```

Protocole backend :

```text
gRPC
```

Opérations exposées :

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

Référence fédérée :

```graphql
type Product @key(fields: "id", resolvable: false) {
  id: ID!
}
```

Rôle :

* appeler le service gRPC `RecommendationService.ListRecommendations` ;
* récupérer une liste d'identifiants de produits recommandés ;
* exposer soit les identifiants seuls, soit des références fédérées vers `Product` ;
* laisser `product-catalog-dgs` résoudre les détails produits ;
* permettre à `currency-dgs` d'ajouter un prix converti via `price(currencyCode)`.

Exemple de fédération :

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

Cette opération démontre une fédération en chaîne :

```text
recommendation-dgs -> product-catalog-dgs -> currency-dgs


Oui : **mets à jour la documentation avant de merger dans `dev`**.

Comme ça, ta branche `feature/product-reviews-dgs` contient un bloc complet :

```text
code du DGS
+ intégration compose/gateway
+ fichiers .graphql de test
+ documentation à jour
```

C’est plus propre que de merger le code puis faire une deuxième branche docs juste après. En plus, tes docs actuelles parlent encore de 4 DGS dans le README et la roadmap, alors qu’on est maintenant à 6 avec `recommendation-dgs` et `product-reviews-dgs`.  

## Ordre conseillé

```text
1. rester sur feature/product-reviews-dgs
2. mettre à jour docs/graphql
3. git add code + docs
4. commit
5. push de la branche
6. merge dans dev
7. push dev
```

## 1. Vérifier l’état actuel

```bash
git status
git branch --show-current
```

Tu dois être sur :

```text
feature/product-reviews-dgs
```

## 2. Mettre à jour les docs

À modifier :

```text
docs/graphql/README.md
docs/graphql/dgs-summary.md
docs/graphql/operations.md
docs/graphql/roadmap.md
docs/graphql/frontend-operations-map.md
```

Dans `README.md`, passe de :

```text
4 DGS fonctionnels
```

à :

```text
6 DGS fonctionnels
```

Et ajoute dans le tableau :

```markdown
| `recommendation-dgs` | 4008 | `recommendation:9001` | gRPC | Fonctionnel |
| `product-reviews-dgs` | 4009 | `product-reviews:3551` | gRPC | Fonctionnel |
```

Dans la commande de lancement, ajoute :

```bash
  recommendation-dgs \
  product-reviews-dgs \
```

Dans les health checks, ajoute :

```bash
curl http://localhost:4008/health
curl http://localhost:4009/health
```


## 6. Product Reviews DGS

Dossier :

```text
src/product-reviews-dgs
````

Backend appelé :

```text
product-reviews:3551
```

Protocole backend :

```text
gRPC
```

Opérations exposées :

```graphql
productReviews(productId: ID!): [ProductReview!]!
averageProductReviewScore(productId: ID!): String!
askProductAiAssistant(productId: ID!, question: String!): String!
```

Extension fédérée :

```graphql
extend type Product @key(fields: "id") {
  id: ID! @external
  reviews: [ProductReview!]!
  averageReviewScore: String!
  askAiAssistant(question: String!): String!
}
```

Rôle :

* récupérer les avis d'un produit ;
* récupérer la note moyenne d'un produit ;
* interroger l'assistant IA lié à un produit ;
* enrichir le type fédéré `Product` avec les avis, la note moyenne et l'assistant produit.

Exemple de fédération :

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

Cette opération démontre une fédération entre :

```text
product-catalog-dgs -> currency-dgs -> product-reviews-dgs
```





