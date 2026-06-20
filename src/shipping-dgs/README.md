# shipping-dgs

DGS GraphQL pour le service `shipping` de l'OpenTelemetry Astronomy Shop.

## Objectif

Ce service expose une API GraphQL minimale au-dessus du service HTTP `shipping`.

Pour l'instant, il expose uniquement l'estimation du coût de livraison en USD.

## Backend consommé

Le DGS appelle le service backend existant :

```txt
POST http://shipping:50050/get-quote