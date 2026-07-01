Oui, tu peux maintenant passer au vrai projet. La bonne stratégie n’est pas de “comprendre tout OpenTelemetry Demo”, mais de **reconstruire progressivement le chemin frontend → backend → future gateway GraphQL**.

Ton sujet demande bien une **Gateway GraphQL fédérée**, des **DGS**, une intégration Docker, et des opérations de validation dans `src/gateway/operations` ; il demande aussi au moins **4 DGS** et au moins **10 opérations frontend identifiées**. 

## 1. Ordre d’exploration du dépôt

### Étape 1 — Comprendre la forme générale, pas le détail

Commence par ces fichiers/dossiers :

```bash
README.md
docker-compose.yml
.env
src/
pb/demo.proto
src/frontend/
```

L’objectif est simplement de repérer les services, les ports, les variables d’environnement et les contrats gRPC. La documentation officielle confirme que l’Astronomy Shop est une application microservices polyglotte, avec des échanges en **gRPC** et en **HTTP**. ([OpenTelemetry][1])

---

### Étape 2 — Lire le frontend comme une carte des besoins

Le dossier le plus important au début est :

```bash
src/frontend/pages/api/
```

Pourquoi ? Parce que le frontend actuel est une application Next.js avec deux couches : une couche cliente et une couche API qui expose des endpoints REST pour relier le client aux services backend. ([GitHub][2])

Dans le dépôt actuel, les endpoints API frontend importants sont notamment :

```bash
src/frontend/pages/api/products/
src/frontend/pages/api/cart.ts
src/frontend/pages/api/checkout.ts
src/frontend/pages/api/currency.ts
src/frontend/pages/api/recommendations.ts
src/frontend/pages/api/shipping.ts
src/frontend/pages/api/product-reviews/
src/frontend/pages/api/product-reviews-avg-score/
src/frontend/pages/api/product-ask-ai-assistant/
```

Le dépôt liste bien ces endpoints côté `pages/api`, ce qui te donne directement la liste des opérations à transformer en queries/mutations GraphQL. ([GitHub][3])

---

### Étape 3 — Lire les gateways existantes du frontend

Ensuite seulement, regarde :

```bash
src/frontend/gateways/
src/frontend/gateways/rpc/
src/frontend/gateways/http/
src/frontend/services/
```

Le dossier `gateways` contient déjà une séparation entre appels **RPC/gRPC** et appels **HTTP**, avec par exemple des gateways RPC et HTTP côté frontend. ([GitHub][4])

Le dossier `services` est aussi important, car il contient notamment les services frontend autour du catalogue et des avis produits. ([GitHub][5])

En clair :

```text
pages/api        = ce que le frontend veut faire
gateways/rpc     = comment le frontend appelle les services gRPC
gateways/http    = comment le frontend appelle les services HTTP
services         = logique d’agrégation côté frontend
pb/demo.proto    = contrat gRPC source
```

---

## 2. Les 4 DGS les plus pertinents pour commencer

Je te conseille de commencer avec ces 4 DGS :

```text
product-catalog-dgs
currency-dgs
cart-dgs
shipping-dgs
```

Pas `checkout-dgs` tout de suite. Il est très important, mais il est plus risqué en premier, car le service checkout orchestre lui-même plusieurs services : cart, currency, payment, product catalog, shipping et email. La documentation officielle le décrit comme le service qui récupère le panier, prépare la commande et orchestre le paiement, l’expédition et l’email. ([OpenTelemetry][6])

### Pourquoi ces 4-là ?

| DGS                   | Pourquoi il est prioritaire                                      | Difficulté |
| --------------------- | ---------------------------------------------------------------- | ---------- |
| `product-catalog-dgs` | Base de tout le site : liste produits, détail produit, recherche | Moyenne    |
| `currency-dgs`        | Petit domaine, très bon pour apprendre un DGS simple             | Faible     |
| `cart-dgs`            | Domaine métier central : lire, ajouter, vider le panier          | Moyenne    |
| `shipping-dgs`        | Premier DGS HTTP, utile pour ne pas faire que du gRPC            | Moyenne    |

Le service `product-catalog` fournit la liste des produits, la recherche et le détail produit ; `cart` stocke les articles du panier ; `currency` convertit les montants ; `shipping` estime les coûts d’expédition. Ce sont donc des domaines simples, visibles dans le frontend, et cohérents pour une première fédération. ([OpenTelemetry][6])

## 3. Vision minimale de la gateway

Au début, ta gateway doit être **bête et stable**. Elle ne doit pas encore faire de logique métier compliquée.

Structure minimale :

```text
src/
├── gateway/
│   ├── package.json
│   ├── tsconfig.json
│   ├── Dockerfile
│   ├── src/
│   │   └── index.ts
│   └── operations/
│       ├── list-products.graphql
│       ├── get-product.graphql
│       ├── get-cart.graphql
│       └── ...
│
├── product-catalog-dgs/
├── currency-dgs/
├── cart-dgs/
└── shipping-dgs/
```

La gateway expose seulement :

```text
/graphql
/health
```

Et elle compose les sous-graphes :

```text
product-catalog-dgs -> http://product-catalog-dgs:4001/graphql
currency-dgs        -> http://currency-dgs:4002/graphql
cart-dgs            -> http://cart-dgs:4003/graphql
shipping-dgs        -> http://shipping-dgs:4004/graphql
```

Dans `docker-compose.yml`, tu ajouteras ensuite :

```text
gateway
product-catalog-dgs
currency-dgs
cart-dgs
shipping-dgs
```

Le sujet demande bien que la gateway soit créée dans `opentelemetry-demo/src`, conteneurisée avec un Dockerfile, et référencée dans `docker-compose.yml`. 

## 4. Schéma GraphQL minimal à viser

### `product-catalog-dgs`

C’est ton DGS propriétaire du type `Product`.

```graphql
type Product @key(fields: "id") {
  id: ID!
  name: String!
  description: String!
  picture: String
  priceUsd: Money!
  categories: [String!]!
}

type Money {
  currencyCode: String!
  units: Int!
  nanos: Int!
}

type Query {
  products(currencyCode: String): [Product!]!
  product(id: ID!, currencyCode: String): Product
  searchProducts(query: String!, currencyCode: String): [Product!]!
}
```

---

### `currency-dgs`

Simple, parfait pour valider un DGS gRPC isolé.

```graphql
type Query {
  supportedCurrencies: [String!]!
  convertMoney(from: MoneyInput!, toCode: String!): Money!
}

input MoneyInput {
  currencyCode: String!
  units: Int!
  nanos: Int!
}
```

---

### `cart-dgs`

C’est là que tu peux réutiliser la fédération proprement.

```graphql
type Cart {
  userId: ID!
  items: [CartItem!]!
}

type CartItem {
  productId: ID!
  quantity: Int!
  product: Product
}

extend type Product @key(fields: "id") {
  id: ID! @external
}

type Query {
  cart(userId: ID!): Cart!
}

type Mutation {
  addItem(userId: ID!, productId: ID!, quantity: Int!): Cart!
  emptyCart(userId: ID!): Boolean!
}
```

L’idée : `cart-dgs` connaît les `productId`, mais ne connaît pas les détails produits. Il renvoie une référence `Product`, et `product-catalog-dgs` résout le vrai produit. C’est exactement le genre de cas où ta V2 QuestBoard avec `@key`, `extend type` et `__resolveReference` devient utile.

---

### `shipping-dgs`

Pour commencer, garde-le simple.

```graphql
type Query {
  shippingQuoteUsd(address: AddressInput!, items: [CartItemInput!]!): Money!
}

input AddressInput {
  streetAddress: String!
  city: String!
  state: String!
  country: String!
  zipCode: String!
}

input CartItemInput {
  productId: ID!
  quantity: Int!
}
```

Ne cherche pas encore à faire une quote convertie dans toutes les devises. Le frontend actuel combine shipping puis currency pour convertir le coût d’expédition. ([GitHub][7]) Tu peux reproduire cette logique plus tard, une fois les deux DGS stables.

## 5. Méthode pour cartographier les opérations frontend

Tu fais un tableau simple comme celui-ci :

| Fonction frontend    | Fichier actuel                          | Service backend                  | Future opération GraphQL | DGS                                |
| -------------------- | --------------------------------------- | -------------------------------- | ------------------------ | ---------------------------------- |
| Lister les produits  | `products/index.ts`                     | Product Catalog                  | `products`               | `product-catalog-dgs`              |
| Voir un produit      | `products/[productId]/index.ts`         | Product Catalog                  | `product(id)`            | `product-catalog-dgs`              |
| Lire le panier       | `cart.ts`                               | Cart + Product Catalog           | `cart(userId)`           | `cart-dgs` + `product-catalog-dgs` |
| Ajouter au panier    | `cart.ts`                               | Cart                             | `addItem`                | `cart-dgs`                         |
| Vider le panier      | `cart.ts`                               | Cart                             | `emptyCart`              | `cart-dgs`                         |
| Lister les devises   | `currency.ts`                           | Currency                         | `supportedCurrencies`    | `currency-dgs`                     |
| Convertir un montant | logique actuelle via gateway currency   | Currency                         | `convertMoney`           | `currency-dgs`                     |
| Estimer livraison    | `shipping.ts`                           | Shipping + Currency              | `shippingQuoteUsd`       | `shipping-dgs`                     |
| Recommandations      | `recommendations.ts`                    | Recommendation + Product Catalog | `recommendations`        | plus tard                          |
| Passer commande      | `checkout.ts`                           | Checkout + Product Catalog       | `placeOrder`             | plus tard                          |
| Avis produit         | `product-reviews/[productId]`           | Product Reviews                  | `productReviews`         | plus tard                          |
| Score moyen          | `product-reviews-avg-score/[productId]` | Product Reviews                  | `averageReviewScore`     | plus tard                          |

Les fichiers actuels confirment par exemple que `cart.ts` fait `GET`, `POST` et `DELETE`, que `checkout.ts` fait un `POST`, que `currency.ts` expose les devises, et que `recommendations.ts` récupère des recommandations puis recharge les produits associés. ([GitHub][8])

## 6. Ordre de travail réaliste

### Phase 0 — Sécuriser le terrain

Objectif : être sûr que ton fork démarre.

```bash
git status
docker compose up --force-recreate --remove-orphans --detach
```

La documentation Docker officielle indique que le lancement standard peut se faire avec `make start` ou `docker compose up --force-recreate --remove-orphans --detach`. ([OpenTelemetry][9])

---

### Phase 1 — Cartographie sans coder

Commande utile :

```bash
find src/frontend/pages/api -type f -name "*.ts" | sort
rg "Gateway|Service|getProduct|getCart|placeOrder|convert|shipping|recommend" src/frontend
rg "service .*Service|rpc " pb/demo.proto
```

Livrable de cette phase :

```text
docs/graphql/frontend-operations-map.md
```

Avec ton tableau : endpoint actuel → backend → future query/mutation → DGS.

---

### Phase 2 — Premier DGS seul : `product-catalog-dgs`

Tu codes uniquement :

```graphql
products
product(id)
searchProducts(query)
```

Tu testes le DGS directement, sans gateway.

Succès attendu :

```text
product-catalog-dgs démarre
GraphiQL/Yoga répond
la query products retourne des produits
```

---

### Phase 3 — Première gateway avec un seul sous-graphe

Tu ajoutes `src/gateway`, mais elle ne compose d’abord que :

```text
product-catalog-dgs
```

Succès attendu :

```text
gateway démarre
query products fonctionne depuis /graphql
```

Ne passe pas à 4 DGS tant que ce point n’est pas stable.

---

### Phase 4 — Ajouter `currency-dgs`

Queries :

```graphql
supportedCurrencies
convertMoney
```

Succès attendu :

```text
products + supportedCurrencies fonctionnent depuis la gateway
```

---

### Phase 5 — Ajouter `cart-dgs`

Mutations et query :

```graphql
cart(userId)
addItem(userId, productId, quantity)
emptyCart(userId)
```

Puis tu ajoutes la fédération :

```graphql
CartItem.product -> Product
```

Succès attendu :

```graphql
query {
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
}
```

Là, tu auras une vraie démonstration de fédération utile.

---

### Phase 6 — Ajouter `shipping-dgs`

Query :

```graphql
shippingQuoteUsd(address, items)
```

Succès attendu :

```text
la gateway sait interroger un DGS qui parle à un service HTTP
```

C’est intéressant pour ton rapport, parce que tu montres que ta gateway n’est pas seulement une façade gRPC : elle sait intégrer des sources backend hétérogènes.

---

### Phase 7 — Créer les fichiers `.graphql`

Dans :

```text
src/gateway/operations/
```

Tu peux déjà créer :

```text
list-products.graphql
get-product.graphql
search-products.graphql
get-supported-currencies.graphql
convert-money.graphql
get-cart.graphql
add-item.graphql
empty-cart.graphql
get-cart-with-products.graphql
get-shipping-quote.graphql
```

Tu atteins déjà les **10 opérations** demandées par le sujet, même avant d’attaquer checkout/recommendation/product-reviews. 

## 7. Ce qui est indispensable, utile, secondaire

### Indispensable

```text
- Comprendre src/frontend/pages/api
- Lire pb/demo.proto
- Créer au moins 4 DGS
- Créer src/gateway
- Brancher la gateway dans docker-compose.yml
- Créer src/gateway/operations/*.graphql
- Tester les opérations une par une
```

### Utile après le MVP

```text
- checkout-dgs
- recommendation-dgs
- product-reviews-dgs
- ad-dgs
- README dédié pour relancer la gateway
- schéma d’architecture avant / après
```

### Secondaire au début

```text
- Observabilité complète de la gateway
- Refactor avancé du frontend
- Remplacement total des endpoints REST existants
- Support mobile complet
- Tests automatisés complexes
```

## Verdict de démarrage

Ton premier périmètre doit être :

```text
Gateway fédérée
+ product-catalog-dgs
+ currency-dgs
+ cart-dgs
+ shipping-dgs
+ 10 fichiers .graphql de validation
```

Et ta règle anti-noyade doit être simple :

```text
1 DGS à la fois.
1 query ou mutation à la fois.
1 test manuel à la fois.
1 commit dès que ça marche.
```

La prochaine étape logique est de construire ton fichier `docs/graphql/frontend-operations-map.md`, car il deviendra à la fois ton guide de développement, ta preuve d’analyse, et la base de ton rapport.

[1]: https://opentelemetry.io/docs/demo/architecture/ "Demo Architecture | OpenTelemetry"
[2]: https://raw.githubusercontent.com/open-telemetry/opentelemetry-demo/main/src/frontend/README.md "raw.githubusercontent.com"
[3]: https://github.com/open-telemetry/opentelemetry-demo/tree/main/src/frontend/pages/api "opentelemetry-demo/src/frontend/pages/api at main · open-telemetry/opentelemetry-demo · GitHub"
[4]: https://github.com/open-telemetry/opentelemetry-demo/tree/main/src/frontend/gateways "opentelemetry-demo/src/frontend/gateways at main · open-telemetry/opentelemetry-demo · GitHub"
[5]: https://github.com/open-telemetry/opentelemetry-demo/tree/main/src/frontend/services "opentelemetry-demo/src/frontend/services at main · open-telemetry/opentelemetry-demo · GitHub"
[6]: https://opentelemetry.io/docs/demo/services/ "Services | OpenTelemetry"
[7]: https://raw.githubusercontent.com/open-telemetry/opentelemetry-demo/main/src/frontend/pages/api/shipping.ts "raw.githubusercontent.com"
[8]: https://raw.githubusercontent.com/open-telemetry/opentelemetry-demo/main/src/frontend/pages/api/cart.ts "raw.githubusercontent.com"
[9]: https://opentelemetry.io/docs/demo/docker-deployment/ "Docker deployment | OpenTelemetry"
