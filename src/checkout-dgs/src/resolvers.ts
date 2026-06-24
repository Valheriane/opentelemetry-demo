import { ChannelCredentials, type ServiceError } from "@grpc/grpc-js";
import {
  CheckoutServiceClient,
  type Address as ProtoAddress,
  type CartItem as ProtoCartItem,
  type CreditCardInfo,
  type Money as ProtoMoney,
  type OrderItem as ProtoOrderItem,
  type OrderResult as ProtoOrderResult,
  type PlaceOrderResponse
} from "./protos/demo.js";

const { CHECKOUT_ADDR = "checkout:5050" } = process.env;

const client = new CheckoutServiceClient(
  CHECKOUT_ADDR,
  ChannelCredentials.createInsecure()
);

type CheckoutAddressInput = {
  streetAddress: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
};

type PlaceOrderInput = {
  userId: string;
  userCurrency: string;
  address: CheckoutAddressInput;
  email: string;
  creditCard: CreditCardInfo;
};

type CheckoutMoney = {
  currencyCode: string;
  units: number;
  nanos: number;
};

type CheckoutAddress = CheckoutAddressInput;

type CheckoutCartItem = {
  productId: string;
  quantity: number;
};

type CheckoutOrderItem = {
  item: CheckoutCartItem | null;
  cost: CheckoutMoney | null;
};

type CheckoutOrder = {
  orderId: string;
  shippingTrackingId: string;
  shippingCost: CheckoutMoney | null;
  shippingAddress: CheckoutAddress | null;
  items: CheckoutOrderItem[];
};

const mapMoney = (money?: ProtoMoney): CheckoutMoney | null => {
  if (!money) {
    return null;
  }

  return {
    currencyCode: money.currencyCode,
    units: money.units,
    nanos: money.nanos
  };
};

const mapAddress = (address?: ProtoAddress): CheckoutAddress | null => {
  if (!address) {
    return null;
  }

  return {
    streetAddress: address.streetAddress,
    city: address.city,
    state: address.state,
    country: address.country,
    zipCode: address.zipCode
  };
};

const mapCartItem = (item?: ProtoCartItem): CheckoutCartItem | null => {
  if (!item) {
    return null;
  }

  return {
    productId: item.productId,
    quantity: item.quantity
  };
};

const mapOrderItem = (orderItem: ProtoOrderItem): CheckoutOrderItem => ({
  item: mapCartItem(orderItem.item),
  cost: mapMoney(orderItem.cost)
});

const mapOrder = (order: ProtoOrderResult): CheckoutOrder => ({
  orderId: order.orderId,
  shippingTrackingId: order.shippingTrackingId,
  shippingCost: mapMoney(order.shippingCost),
  shippingAddress: mapAddress(order.shippingAddress),
  items: order.items.map(mapOrderItem)
});

const placeOrder = (input: PlaceOrderInput): Promise<CheckoutOrder> => {
  return new Promise((resolve, reject) => {
    client.placeOrder(
      {
        userId: input.userId,
        userCurrency: input.userCurrency,
        address: input.address,
        email: input.email,
        creditCard: input.creditCard
      },
      (error: ServiceError | null, response: PlaceOrderResponse) => {
        if (error) {
          reject(error);
          return;
        }

        if (!response.order) {
          reject(new Error("Checkout service returned no order."));
          return;
        }

        resolve(mapOrder(response.order));
      }
    );
  });
};

export const resolvers = {
  Query: {
    checkoutDgsStatus: (): string => "ok"
  },

  Mutation: {
    placeOrder: async (
      _parent: unknown,
      args: { input: PlaceOrderInput }
    ): Promise<CheckoutOrder> => {
      return placeOrder(args.input);
    }
  },

  CheckoutCartItem: {
    product: (parent: CheckoutCartItem) => ({
      __typename: "Product",
      id: parent.productId
    })
  }
};
