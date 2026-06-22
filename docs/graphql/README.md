# GraphQL Federation - OpenTelemetry Astronomy Shop

Ce dossier documente la couche GraphQL fédérée ajoutée au projet OpenTelemetry Astronomy Shop.

L'objectif de cette contribution est d'ajouter une Gateway GraphQL fédérée entre le frontend existant et les microservices backend existants, sans modifier les services backend.

La Gateway permet d'exposer une interface GraphQL unifiée au-dessus de plusieurs DGS, chacun responsable d'un domaine métier.

## État actuel

La contribution contient actuellement :

- une Gateway Apollo fédérée ;
- 4 DGS fonctionnels ;
- une intégration Docker Compose via `compose.extras.yaml` ;
- des opérations GraphQL de test dans `src/gateway/operations`.

## DGS implémentés

| DGS | Port | Backend appelé | Protocole | Statut |
|---|---:|---|---|---|
| `shipping-dgs` | 4004 | `shipping:50050` | HTTP | Fonctionnel |
| `product-catalog-dgs` | 4005 | `product-catalog:3550` | gRPC | Fonctionnel |
| `currency-dgs` | 4006 | `currency:7001` | gRPC | Fonctionnel |
| `cart-dgs` | 4007 | `cart:7070` | gRPC | Fonctionnel |
| `graphql-gateway` | 4000 | DGS GraphQL | GraphQL Federation | Fonctionnel |

## Points importants

La Gateway expose un schéma GraphQL unique composé à partir des différents DGS.

Deux cas de fédération entre DGS sont actuellement démontrés :

1. `cart-dgs` expose les items du panier avec des références produit.
2. `product-catalog-dgs` résout les détails des produits.
3. `currency-dgs` étend le type `Product` pour exposer un prix converti via `price(currencyCode: String!)`.

Cela permet par exemple de demander un panier avec les détails produits, ou un produit avec son prix USD et son prix converti.

## Lancement local

Depuis la racine du projet :

```bash
docker compose -f compose.yaml -f compose.extras.yaml up -d --build \
  shipping-dgs \
  product-catalog-dgs \
  currency-dgs \
  cart-dgs \
  graphql-gateway
````

La Gateway est ensuite disponible sur :

```text
http://localhost:4000/
```

## Health checks

```bash
curl http://localhost:4004/health
curl http://localhost:4005/health
curl http://localhost:4006/health
curl http://localhost:4007/health
```

## Opérations GraphQL de test

Les opérations de test sont stockées dans :

```text
src/gateway/operations
```

Elles peuvent être exécutées avec :

```bash
jq -Rs '{query: .}' src/gateway/operations/<operation>.graphql \
  | curl -s http://localhost:4000/ \
      -H "content-type: application/json" \
      --data-binary @- | jq
```

