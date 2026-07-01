type AddressInput = {
  streetAddress: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
};

type CartItemInput = {
  productId: string;
  quantity: number;
};

type ShippingQuoteArgs = {
  address: AddressInput;
  items: CartItemInput[];
};

type BackendMoney = {
  currency_code?: string;
  currencyCode?: string;
  units?: number | string;
  nanos?: number | string;
};

type BackendShippingResponse = {
  cost_usd?: BackendMoney;
  costUsd?: BackendMoney;
  cost?: BackendMoney;
};

type Money = {
  currencyCode: string;
  units: number;
  nanos: number;
};

const SHIPPING_ADDR = process.env.SHIPPING_ADDR || 'http://shipping:50050';

function mapAddressToBackend(address: AddressInput) {
  return {
    street_address: address.streetAddress,
    city: address.city,
    state: address.state,
    country: address.country,
    zip_code: address.zipCode
  };
}

function mapItemsToBackend(items: CartItemInput[]) {
  return items.map((item) => ({
    product_id: item.productId,
    quantity: item.quantity
  }));
}

function mapMoneyFromBackend(money: BackendMoney | undefined): Money {
  if (!money) {
    throw new Error('Shipping service response does not contain a valid cost.');
  }

  return {
    currencyCode: money.currency_code ?? money.currencyCode ?? 'USD',
    units: Number(money.units ?? 0),
    nanos: Number(money.nanos ?? 0)
  };
}

export const resolvers = {
  Query: {
    shippingQuoteUsd: async (
      _parent: unknown,
      args: ShippingQuoteArgs
    ): Promise<Money> => {
      const requestBody = {
        items: mapItemsToBackend(args.items),
        address: mapAddressToBackend(args.address)
      };

      const response = await fetch(`${SHIPPING_ADDR}/get-quote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorBody = await response.text();

        throw new Error(
          `Shipping service error: ${response.status} ${response.statusText} - ${errorBody}`
        );
      }

      const data = (await response.json()) as BackendShippingResponse;

      return mapMoneyFromBackend(data.cost_usd ?? data.costUsd ?? data.cost);
    }
  }
};