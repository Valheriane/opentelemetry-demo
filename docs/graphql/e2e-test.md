# Test de bout en bout de la Gateway GraphQL

Ce document décrit le script de test de bout en bout permettant de valider le parcours utilisateur principal via la Gateway GraphQL fédérée.

## Objectif

Le script permet de vérifier que la Gateway GraphQL est capable d'orchestrer les différents DGS du projet autour d'un scénario complet :

```text id="2uxti7"
consultation catalogue
consultation fiche produit
avis produit
recommandations
publicités
estimation livraison
ajout panier
checkout complet
```

## Script utilisé

```bash id="te51f5"
./scripts/test-gateway-e2e.sh
```

Le script utilise par défaut :

```text id="ce4h38"
Gateway : http://localhost:4000/
Produit : OLJCESPC7Z
```

Un identifiant utilisateur unique est généré automatiquement à chaque lancement afin d'éviter les conflits avec les paniers précédents.

## Lancement

Avant de lancer le script, la stack Docker doit être démarrée avec la Gateway et les DGS nécessaires.

```bash id="aw9081"
./scripts/test-gateway-e2e.sh
```

Il est aussi possible de modifier l'URL de la Gateway :

```bash id="emfo2p"
GATEWAY_URL=http://localhost:4000/ ./scripts/test-gateway-e2e.sh
```

Ou le produit testé :

```bash id="hgotj2"
PRODUCT_ID=OLJCESPC7Z ./scripts/test-gateway-e2e.sh
```

## Parcours validé

Le script exécute les étapes suivantes :

1. récupération de la liste des produits ;
2. lecture d'une fiche produit enrichie ;
3. conversion du prix en EUR ;
4. récupération des avis produit ;
5. appel à l'assistant IA produit ;
6. récupération des recommandations ;
7. récupération des publicités contextuelles ;
8. calcul d'un devis de livraison ;
9. ajout du produit au panier ;
10. passage de commande via `placeOrder`.

## DGS validés

Le script valide le flux suivant :

```text id="koux5u"
product-catalog-dgs -> currency-dgs -> product-reviews-dgs -> recommendation-dgs -> ad-dgs -> shipping-dgs -> cart-dgs -> checkout-dgs
```

## Résultat attendu

En cas de succès, le script affiche :

```text id="ch9b6x"
E2E TEST PASSED
```

Il retourne également :

```text id="ib74rx"
Order ID
Tracking ID
Nombre d'items commandés
```

Ce test constitue une preuve de fonctionnement globale de la Gateway GraphQL fédérée et de son intégration avec les huit DGS implémentés.

## Test de bout en bout

Un script de test permet de valider un parcours utilisateur complet via la Gateway GraphQL :

```bash
./scripts/test-gateway-e2e.sh
```

## Lancement via Makefile

Le scénario complet peut être lancé avec :

```bash
make demo-graphql