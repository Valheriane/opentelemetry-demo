# GraphQL Federation Roadmap

## Réalisé

- Création d'une Gateway Apollo fédérée.
- Création de 4 DGS :
  - `shipping-dgs`
  - `product-catalog-dgs`
  - `currency-dgs`
  - `cart-dgs`
- Intégration Docker Compose via `compose.extras.yaml`.
- Ajout d'opérations GraphQL de test.
- Validation de plusieurs flux via `localhost:4000`.
- Démonstration de la fédération entre :
  - `cart-dgs` et `product-catalog-dgs`
  - `product-catalog-dgs` et `currency-dgs`

## À faire ensuite

Objectif idéal : couvrir progressivement les autres services backend utilisés par le frontend.

DGS possibles à ajouter :

- `checkout-dgs`
- `recommendation-dgs`
- `ad-dgs`
- `product-reviews-dgs`

## Améliorations possibles

- Ajouter davantage d'opérations GraphQL correspondant aux usages réels du frontend.
- Ajouter une documentation plus détaillée des chemins frontend actuels.
- Ajouter des tests automatisés autour des opérations GraphQL.
- Étudier une intégration progressive du frontend avec la Gateway.
- Réduire progressivement le couplage du frontend aux routes API existantes.
- Ajouter éventuellement de l'observabilité sur la Gateway et les DGS.

## Étape frontend possible

À terme, le frontend pourrait être modifié progressivement pour consommer la Gateway GraphQL au lieu d'appeler directement ses routes API internes.

Cette étape devra être faite avec prudence :

1. choisir une page simple ;
2. remplacer un seul appel ;
3. tester le comportement ;
4. conserver une possibilité de retour arrière ;
5. ne pas modifier tout le frontend d'un coup.

