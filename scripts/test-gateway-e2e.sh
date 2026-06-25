#!/usr/bin/env bash

set -euo pipefail

GATEWAY_URL="${GATEWAY_URL:-http://localhost:4000/}"
PRODUCT_ID="${PRODUCT_ID:-OLJCESPC7Z}"
USER_ID="${USER_ID:-gateway-e2e-test-$(date +%s)}"

echo "=========================================="
echo " GraphQL Gateway E2E Test"
echo "=========================================="
echo "Gateway : $GATEWAY_URL"
echo "User ID : $USER_ID"
echo "Product : $PRODUCT_ID"
echo

post_graphql() {
  local query="$1"

  jq -n --arg query "$query" '{query: $query}' \
    | curl -s "$GATEWAY_URL" \
        -H "content-type: application/json" \
        --data-binary @-
}

run_step() {
  local title="$1"
  local query="$2"

  echo
  echo "------------------------------------------"
  echo "$title"
  echo "------------------------------------------"

  local response
  response="$(post_graphql "$query")"

  echo "$response" | jq

  if echo "$response" | jq -e 'has("errors")' > /dev/null; then
    echo
    echo "❌ Step failed: $title"
    exit 1
  fi

  echo "✅ OK"
}

run_step "1. List products from product-catalog-dgs" "
query ListProducts {
  products {
    id
    name
    priceUsd {
      currencyCode
      units
      nanos
    }
  }
}
"

run_step "2. Read product detail with price conversion, reviews and AI assistant" "
query ReadProduct {
  product(id: \"$PRODUCT_ID\") {
    id
    name
    description
    priceUsd {
      currencyCode
      units
      nanos
    }
    price(currencyCode: \"EUR\") {
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
    askAiAssistant(question: \"Is this product useful for beginners?\")
  }
}
"

run_step "3. Get recommendations with product details and converted prices" "
query GetRecommendations {
  recommendedProducts(
    userId: \"$USER_ID\"
    productIds: [\"$PRODUCT_ID\"]
    limit: 4
  ) {
    id
    name
    priceUsd {
      currencyCode
      units
      nanos
    }
    price(currencyCode: \"EUR\") {
      currencyCode
      units
      nanos
    }
  }
}
"

run_step "4. Get contextual ads" "
query GetAds {
  ads(contextKeys: []) {
    redirectUrl
    text
  }
}
"

run_step "5. Get shipping quote" "
query GetShippingQuote {
  shippingQuoteUsd(
    address: {
      streetAddress: \"1600 Amphitheatre Parkway\"
      city: \"Mountain View\"
      state: \"CA\"
      country: \"United States\"
      zipCode: \"94043\"
    }
    items: [
      {
        productId: \"$PRODUCT_ID\"
        quantity: 1
      }
    ]
  ) {
    currencyCode
    units
    nanos
  }
}
"

run_step "6. Add product to cart" "
mutation AddCartItem {
  addCartItem(
    userId: \"$USER_ID\"
    productId: \"$PRODUCT_ID\"
    quantity: 1
  ) {
    userId
    items {
      productId
      quantity
    }
  }
}
"

CHECKOUT_RESPONSE="$(post_graphql "
mutation PlaceOrder {
  placeOrder(
    input: {
      userId: \"$USER_ID\"
      userCurrency: \"EUR\"
      address: {
        streetAddress: \"1600 Amphitheatre Parkway\"
        city: \"Mountain View\"
        state: \"CA\"
        country: \"United States\"
        zipCode: \"94043\"
      }
      email: \"gateway-e2e-test@example.com\"
      creditCard: {
        creditCardNumber: \"4111111111111111\"
        creditCardCvv: 123
        creditCardExpirationYear: 2030
        creditCardExpirationMonth: 12
      }
    }
  ) {
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
")"

echo
echo "------------------------------------------"
echo "7. Place checkout order"
echo "------------------------------------------"
echo "$CHECKOUT_RESPONSE" | jq

if echo "$CHECKOUT_RESPONSE" | jq -e 'has("errors")' > /dev/null; then
  echo
  echo "❌ Step failed: checkout"
  exit 1
fi

ORDER_ID="$(echo "$CHECKOUT_RESPONSE" | jq -r '.data.placeOrder.orderId')"
TRACKING_ID="$(echo "$CHECKOUT_RESPONSE" | jq -r '.data.placeOrder.shippingTrackingId')"
ITEM_COUNT="$(echo "$CHECKOUT_RESPONSE" | jq -r '.data.placeOrder.items | length')"

echo "✅ OK"

echo
echo "=========================================="
echo " E2E TEST PASSED"
echo "=========================================="
echo "Order ID     : $ORDER_ID"
echo "Tracking ID  : $TRACKING_ID"
echo "Items ordered: $ITEM_COUNT"
echo
echo "Validated flow:"
echo "product-catalog-dgs -> currency-dgs -> product-reviews-dgs -> recommendation-dgs -> ad-dgs -> shipping-dgs -> cart-dgs -> checkout-dgs"
