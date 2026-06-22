import { ChannelCredentials } from "@grpc/grpc-js";
import { CartServiceClient } from "./protos/demo.js";
import type { Cart as GrpcCart, CartItem as GrpcCartItem } from "./protos/demo.js";

const { CART_ADDR = "cart:7070" } = process.env;

const client = new CartServiceClient(
  CART_ADDR,
  ChannelCredentials.createInsecure()
);

function getCartGrpc(userId: string): Promise<GrpcCart> {
  return new Promise((resolve, reject) => {
    client.getCart({ userId }, (error, response) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(response);
    });
  });
}

function addItemGrpc(userId: string, item: GrpcCartItem): Promise<void> {
  return new Promise((resolve, reject) => {
    client.addItem({ userId, item }, error => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

function emptyCartGrpc(userId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    client.emptyCart({ userId }, error => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

function mapCart(cart: GrpcCart) {
  return {
    userId: cart.userId,
    items: cart.items?.map(mapCartItem) ?? []
  };
}

function mapCartItem(item: GrpcCartItem) {
  return {
    productId: item.productId,
    quantity: item.quantity
  };
}

export const resolvers = {
  Query: {
    cart: async (_parent: unknown, args: { userId: string }) => {
      const cart = await getCartGrpc(args.userId);
      return mapCart(cart);
    }
  },

  Mutation: {
    addCartItem: async (
      _parent: unknown,
      args: { userId: string; productId: string; quantity: number }
    ) => {
      await addItemGrpc(args.userId, {
        productId: args.productId,
        quantity: args.quantity
      });

      const cart = await getCartGrpc(args.userId);
      return mapCart(cart);
    },

    emptyCart: async (_parent: unknown, args: { userId: string }) => {
      await emptyCartGrpc(args.userId);

      const cart = await getCartGrpc(args.userId);
      return mapCart(cart);
    }
  },

  CartItem: {
    product: (parent: { productId: string }) => {
      return {
        __typename: "Product",
        id: parent.productId
      };
    }
  }
};
