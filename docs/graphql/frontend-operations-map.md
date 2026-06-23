Respire : ta panique est normale. Le dépôt est volontairement énorme parce que c’est une démo microservices complète, pas un petit projet pédagogique. Mais **ton travail ne consiste pas à comprendre tout OpenTelemetry Demo**. Le README confirme que c’est un système distribué microservices proche d’un environnement réel, donc oui, il y a beaucoup de dossiers, d’outils et de services. 

Ton périmètre réel est beaucoup plus petit.

## La réponse importante

Tu ne dois pas aller “profond” dans tout le projet initial.

Tu dois seulement comprendre ce couloir :

```text
frontend actuel
   ↓
src/frontend/pages/api
   ↓
src/frontend/gateways
   ↓
pb/demo.proto ou service HTTP
   ↓
services backend existants
```

Et ensuite tu construis :

```text
frontend actuel / opérations existantes
   ↓
future gateway GraphQL
   ↓
DGS
   ↓
services backend existants
```

Le sujet demande justement une couche GraphQL entre le frontend et les microservices, avec des DGS qui consomment les API existantes sans modifier les services backend. 

## Ce que tu dois ignorer pour l’instant

Dans `src/`, tu peux ignorer au début :

```text
accounting
email
flagd
flagd-ui
fraud-detection
frontend-proxy
grafana
image-provider
jaeger
kafka
llm
load-generator
opensearch
otel-collector
payment
postgresql
prometheus
quote
react-native-app
telemetry-docs
```

Ce n’est pas inutile dans le projet global, mais ce n’est pas ton point d’entrée.

Tu ne vas pas auditer toute la boutique. Tu vas refaire proprement **la couche d’accès** pour quelques fonctionnalités principales.

## Les dossiers que tu dois vraiment regarder

Pour l’instant, limite-toi à ça :

```text
src/frontend/pages/api
src/frontend/gateways
src/frontend/protos
pb/demo.proto
compose.yaml
src/product-catalog
src/cart
src/currency
src/shipping
```

Et même là, tu ne lis pas tout. Tu suis seulement le trajet d’une opération.

Par exemple pour les produits :

```text
src/frontend/pages/api/products/index.ts
   ↓
src/frontend/gateways/rpc/ProductCatalog.gateway.ts
   ↓
pb/demo.proto
   ↓
src/product-catalog
```

Pour le panier :

```text
src/frontend/pages/api/cart.ts
   ↓
src/frontend/gateways/rpc/Cart.gateway.ts
   ↓
pb/demo.proto
   ↓
src/cart
```

Pour la livraison :

```text
src/frontend/pages/api/shipping.ts
   ↓
src/frontend/gateways/http/Shipping.gateway.ts
   ↓
src/shipping
```

## Est-ce que tu récupères juste les URLs REST ?

Pas exactement.

Il y a deux cas :

### Cas 1 — Service HTTP

Pour `shipping`, oui, tu vas regarder l’URL HTTP utilisée par le frontend.

Tu la trouves ici :

```text
src/frontend/gateways/http/Shipping.gateway.ts
```

Et éventuellement dans :

```text
src/frontend/pages/api/shipping.ts
src/shipping
```

### Cas 2 — Service gRPC

Pour `product-catalog`, `cart`, `currency`, `checkout`, `recommendation`, etc., ce ne sont pas des URLs REST classiques.

Tu dois regarder :

```text
pb/demo.proto
```

C’est le contrat. C’est là que tu vois ce que le service expose :

```text
service ProductCatalogService
service CartService
service CurrencyService
service CheckoutService
service RecommendationService
```

Puis tu regardes les gateways frontend existantes :

```text
src/frontend/gateways/rpc/ProductCatalog.gateway.ts
src/frontend/gateways/rpc/Cart.gateway.ts
src/frontend/gateways/rpc/Currency.gateway.ts
```

Ces fichiers te montrent déjà comment le frontend appelle les services gRPC. Donc tu n’as pas à deviner.

## Comment savoir ce que l’API expose ?

Tu as trois sources, dans cet ordre :

### 1. Ce que le frontend utilise vraiment

```text
src/frontend/pages/api
```

C’est ta source la plus importante.

Exemple : s’il existe `cart.ts` avec `GET`, `POST`, `DELETE`, alors tu sais que ta gateway GraphQL devra probablement exposer :

```graphql
cart(userId: ID!)
addItem(...)
emptyCart(...)
```

Le sujet demande d’identifier au moins 10 opérations actuellement utilisées par le frontend et de les exposer via la gateway. 

### 2. Comment le frontend appelle les services

```text
src/frontend/gateways
```

Là tu vois si c’est :

```text
gRPC
HTTP
```

Tu vois aussi les noms des méthodes appelées.

### 3. Le contrat backend

```text
pb/demo.proto
```

Pour les services gRPC, c’est le document central. Tu n’as pas besoin de comprendre tout le code interne du service au début. Tu dois surtout comprendre :

```text
nom de la méthode
request
response
types utilisés
```

## Ton périmètre de lecture minimal

Tu peux te faire une règle très simple :

```text
Je n’ouvre un dossier backend que si une route frontend l’utilise.
```

Donc tu ne pars pas de `src/` en te disant “je dois tout comprendre”.

Tu pars de :

```text
src/frontend/pages/api
```

Puis tu suis uniquement les fils nécessaires.

## Les 4 DGS que je garderais malgré ta panique

Je maintiens ce périmètre, parce qu’il est raisonnable :

```text
product-catalog-dgs
currency-dgs
cart-dgs
shipping-dgs
```

Pourquoi ?

| DGS                   | Pourquoi                                                          |
| --------------------- | ----------------------------------------------------------------- |
| `product-catalog-dgs` | C’est la base du site : liste produits, détail produit, recherche |
| `currency-dgs`        | Petit service gRPC, bon pour apprendre sans trop de logique       |
| `cart-dgs`            | Très métier, utile pour montrer une mutation GraphQL              |
| `shipping-dgs`        | Intéressant car HTTP, donc différent des autres                   |

Le sujet liste justement les services backend directement utilisés par le frontend, dont `Product Catalog`, `Cart`, `Currency`, `Shipping`, `Checkout`, `Recommendation`, `Ad` et `Product Reviews`. 

## Ce qu’on ne fait pas maintenant

On ne commence pas par :

```text
checkout
product-reviews
ad
observabilité de la gateway
modification du frontend
tests automatiques complexes
```

Ce sera pour après.

## Ta méthode anti-panique

Tu ne dois pas regarder le projet comme ça :

```text
Je dois comprendre OpenTelemetry Demo.
```

Tu dois le regarder comme ça :

```text
Je dois remplacer progressivement les appels frontend existants par des opérations GraphQL équivalentes.
```

Donc pour chaque fonctionnalité, tu remplis une ligne :

| Fonction        | Fichier frontend                          | Gateway actuelle            | Backend             | Future opération GraphQL |
| --------------- | ----------------------------------------- | --------------------------- | ------------------- | ------------------------ |
| Lister produits | `pages/api/products/index.ts`             | `ProductCatalog.gateway.ts` | gRPC ProductCatalog | `products`               |
| Détail produit  | `pages/api/products/[productId]/index.ts` | `ProductCatalog.gateway.ts` | gRPC ProductCatalog | `product(id)`            |
| Lire panier     | `pages/api/cart.ts`                       | `Cart.gateway.ts`           | gRPC Cart           | `cart(userId)`           |
| Ajouter panier  | `pages/api/cart.ts`                       | `Cart.gateway.ts`           | gRPC Cart           | `addItem`                |
| Vider panier    | `pages/api/cart.ts`                       | `Cart.gateway.ts`           | gRPC Cart           | `emptyCart`              |
| Devises         | `pages/api/currency.ts`                   | `Currency.gateway.ts`       | gRPC Currency       | `supportedCurrencies`    |
| Livraison       | `pages/api/shipping.ts`                   | `Shipping.gateway.ts`       | HTTP Shipping       | `shippingQuote`          |
| Recommandations produits | `pages/api/recommendations.ts` | `Recommendations.gateway.ts` | gRPC Recommendation | `recommendedProductIds`, `recommendedProducts` |

Rien que ça, tu as déjà une base solide.

## Première mission, très concrète

Ne code rien tout de suite.

Dans ton terminal, à la racine du projet, lance seulement ça :

```bash
find src/frontend/pages/api -type f | sort
```

Puis :

```bash
find src/frontend/gateways -type f | sort
```

Puis :

```bash
grep -n "service .*Service" pb/demo.proto
```

Et enfin :

```bash
grep -n "rpc " pb/demo.proto
```

Le but n’est pas de tout comprendre. Le but est de créer ta première carte :

```text
endpoint frontend → gateway frontend existante → méthode backend → opération GraphQL future
```

## Ton objectif immédiat

Pas de gateway.
Pas de DGS.
Pas de Dockerfile.

Juste cette carte :

```text
docs/graphql/frontend-operations-map.md
```

Avec 10 opérations maximum au début.

Une fois cette carte faite, le projet devient beaucoup moins effrayant, parce que tu ne regarderas plus 40 dossiers : tu suivras seulement 10 chemins précis.

Oui, là on a exactement les bonnes infos. Et bonne nouvelle : **tu n’as pas besoin de fouiller tout le dossier `src/shipping` pour commencer**. Les deux fichiers que tu as donnés suffisent déjà à identifier la route utilisée.

Il y a simplement deux niveaux d’API, ce qui rend la lecture confuse au début.

## 1. Ce que le frontend expose actuellement

Le fichier :

```text id="tna9zs"
src/frontend/pages/api/shipping.ts
```

expose côté frontend une route Next.js :

```text id="s0j0b5"
GET /api/shipping
```

Cette route reçoit trois infos dans la query string :

```text id="o77n5n"
itemList
currencyCode
address
```

Donc côté frontend actuel, l’appel ressemble conceptuellement à :

```text id="mwtvb1"
GET /api/shipping?itemList=...&currencyCode=EUR&address=...
```

Mais cette route **n’est pas le vrai service shipping**. C’est une couche intermédiaire du frontend.

---

## 2. Ce que le backend shipping expose réellement pour cette fonctionnalité

Dans :

```text id="gmlumr"
src/frontend/gateways/http/Shipping.gateway.ts
```

on voit l’appel réel :

```ts id="n6rsgh"
const response = await fetch(`${SHIPPING_ADDR}/get-quote`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(requestBody),
});
```

Donc la route backend utile est :

```text id="ep0gws"
POST http://shipping:50050/get-quote
```

Et comme ton `.env` donne :

```env id="vf0arm"
SHIPPING_PORT=50050
SHIPPING_ADDR=http://shipping:${SHIPPING_PORT}
```

alors dans Docker, ton futur `shipping-dgs` devra appeler :

```text id="y8wcux"
http://shipping:50050/get-quote
```

C’est ça la route à envelopper dans GraphQL.

---

## 3. Ce que ton DGS doit comprendre

Le service shipping attend un body en `snake_case`.

Le frontend transforme actuellement une adresse comme ça :

```ts id="167vcf"
{
  streetAddress,
  city,
  state,
  country,
  zipCode
}
```

en :

```json id="w0lqvk"
{
  "street_address": "...",
  "city": "...",
  "state": "...",
  "country": "...",
  "zip_code": "..."
}
```

Et les items comme ça :

```ts id="8l0gea"
{
  productId,
  quantity
}
```

en :

```json id="mnutmm"
{
  "product_id": "...",
  "quantity": 1
}
```

Donc ton `shipping-dgs` devra faire exactement la même transformation.

---

## 4. Le trajet actuel complet

Voilà ce qui se passe aujourd’hui :

```text id="3pvksx"
Frontend page
   ↓
GET /api/shipping
   ↓
src/frontend/pages/api/shipping.ts
   ↓
ShippingGateway.getShippingCost(...)
   ↓
POST http://shipping:50050/get-quote
   ↓
réponse cost_usd
   ↓
CurrencyGateway.convert(costUsd, currencyCode)
   ↓
réponse finale dans la devise demandée
```

Donc attention : le fichier `shipping.ts` ne fait pas seulement du shipping. Il fait aussi une conversion de devise après avoir obtenu le coût en dollars.

Pour ton premier DGS, je te conseille de ne pas faire cette conversion tout de suite.

---

## 5. Ton premier GraphQL doit rester simple

Pour commencer, expose seulement le coût en USD :

```graphql id="h6uk2t"
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

type Money {
  currencyCode: String!
  units: Int!
  nanos: Int!
}
```

Pourquoi `shippingQuoteUsd` et pas juste `shippingQuote` ? Parce que le service renvoie un champ :

```text id="9bleaj"
cost_usd
```

Donc autant être honnête dans le nom au début. Plus tard, quand tu auras `currency-dgs`, tu pourras faire une query plus complète avec conversion.

---

## 6. Ce que ton resolver devra faire

Le resolver GraphQL devra recevoir :

```graphql id="m26ajc"
shippingQuoteUsd(
  address: {
    streetAddress: "1600 Amphitheatre Parkway"
    city: "Mountain View"
    state: "CA"
    country: "United States"
    zipCode: "94043"
  }
  items: [
    {
      productId: "OLJCESPC7Z"
      quantity: 1
    }
  ]
)
```

Puis envoyer au service shipping :

```json id="q8ejqd"
{
  "items": [
    {
      "product_id": "OLJCESPC7Z",
      "quantity": 1
    }
  ],
  "address": {
    "street_address": "1600 Amphitheatre Parkway",
    "city": "Mountain View",
    "state": "CA",
    "country": "United States",
    "zip_code": "94043"
  }
}
```

Puis recevoir probablement :

```json id="3fdoak"
{
  "cost_usd": {
    "currency_code": "USD",
    "units": 8,
    "nanos": 990000000
  }
}
```

Et retourner en GraphQL :

```json id="63wxpw"
{
  "currencyCode": "USD",
  "units": 8,
  "nanos": 990000000
}
```

---

## 7. Ta ligne de cartographie pour shipping

Dans ton futur fichier :

```text id="l0gp59"
docs/graphql/frontend-operations-map.md
```

tu peux déjà noter :

| Fonction                     | Fichier frontend                     | Gateway actuelle                                 | Backend appelé | Route backend     | Future opération GraphQL           |
| ---------------------------- | ------------------------------------ | ------------------------------------------------ | -------------- | ----------------- | ---------------------------------- |
| Estimer le coût de livraison | `src/frontend/pages/api/shipping.ts` | `src/frontend/gateways/http/Shipping.gateway.ts` | `shipping`     | `POST /get-quote` | `shippingQuoteUsd(address, items)` |

Et tu peux ajouter une note :

```text id="r4d78o"
La route frontend actuelle convertit aussi le prix via CurrencyGateway. Dans un premier temps, le shipping-dgs expose seulement le coût USD renvoyé par le service shipping. La conversion sera traitée plus tard via currency-dgs.
```

---

## 8. Est-ce qu’il faut chercher d’autres routes dans `src/shipping` ?

Pas maintenant.

Tu as déjà trouvé la route que le frontend utilise vraiment :

```text id="dwl8su"
POST /get-quote
```

Il existe probablement aussi une logique liée à l’expédition réelle de commande, souvent équivalente à :

```text id="xy6c2b"
ShipOrder
```

Mais dans ton fichier `shipping.ts`, le frontend n’utilise que le devis de livraison, pas l’expédition finale directement.

Donc pour le MVP :

```text id="2l8icd"
on ignore ShipOrder
on garde GetQuote
on fait shippingQuoteUsd
```

---

## 9. Conclusion nette

Oui, tu as trouvé la bonne piste.

Ton premier DGS doit envelopper ceci :

```text id="3veo0x"
POST http://shipping:50050/get-quote
```

avec cette opération GraphQL :

```graphql id="gpbz0e"
query GetShippingQuote {
  shippingQuoteUsd(
    address: {
      streetAddress: "1600 Amphitheatre Parkway"
      city: "Mountain View"
      state: "CA"
      country: "United States"
      zipCode: "94043"
    }
    items: [
      {
        productId: "OLJCESPC7Z"
        quantity: 1
      }
    ]
  ) {
    currencyCode
    units
    nanos
  }
}
```

Tu n’as pas besoin de comprendre tout le service shipping maintenant. Tu viens déjà d’identifier : **l’entrée frontend, la gateway actuelle, la route backend, le payload attendu, la réponse, et la future opération GraphQL**. C’est exactement la bonne méthode.

