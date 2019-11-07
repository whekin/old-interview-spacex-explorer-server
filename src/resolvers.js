import { paginateResults } from './utils';
import { GraphQLScalarType } from 'graphql';
import { GraphQLError } from 'graphql/error';
import { Kind } from 'graphql/language';

// got from https://github.com/Urigo/graphql-scalars/blob/master/src/resolvers/DateTime.ts
const DateTime = new GraphQLScalarType({
  name: 'DateTime',

  description: 'Use JavaScript Date object for date/time fields.',

  serialize(value) {
    let v = value;

    if (!(v instanceof Date) && typeof v !== 'string' && typeof v !== 'number') {
      throw new TypeError(
        `Value is not an instance of Date, Date string or number: ${JSON.stringify(v)}`,
      );
    }

    if (typeof v === 'string') {
      v = new Date();

      v.setTime(Date.parse(value));
    } else if (typeof v === 'number') {
      v = new Date(v);
    }

    // eslint-disable-next-line no-restricted-globals
    if (Number.isNaN(v.getTime())) {
      throw new TypeError(`Value is not a valid Date: ${JSON.stringify(v)}`);
    }

    return v.toJSON();
  },

  parseValue(value) {
    const date = new Date(value);

    // eslint-disable-next-line no-restricted-globals
    if (Number.isNaN(date.getTime())) {
      throw new TypeError(`Value is not a valid Date: ${value}`);
    }

    return date;
  },

  parseLiteral(ast) {
    if (ast.kind !== Kind.STRING && ast.kind !== Kind.INT) {
      throw new GraphQLError(
        `Can only parse strings & integers to dates but got a: ${ast.kind}`,
      );
    }

    const result = new Date(ast.kind === Kind.INT ? Number(ast.value) : ast.value);

    // eslint-disable-next-line no-restricted-globals
    if (Number.isNaN(result.getTime())) {
      throw new GraphQLError(`Value is not a valid Date: ${ast.value}`);
    }

    if (ast.kind === Kind.STRING && ast.value !== result.toJSON()) {
      throw new GraphQLError(
        `Value is not a valid Date format (YYYY-MM-DDTHH:MM:SS.SSSZ): ${
          ast.value
        }`,
      );
    }

    return result;
  },
});


export default {
  DateTime,
  Query: {
    launches: async (_, { pageSize = 20, after, from, to }, { dataSources }) => {
      const allLaunches = await dataSources.launchAPI.getAllLaunches();
      allLaunches.reverse();

      const launches = paginateResults({
        after,
        pageSize,
        results: allLaunches,
        from,
        to
      });

      return {
        launches,
        cursor: launches.length ? launches[launches.length - 1].cursor : null,
        hasMore: launches.length
          ? launches[launches.length - 1].cursor
            !== allLaunches[allLaunches.length - 1].cursor
          : false,
      };
    },
    launch: (_, { id }, { dataSources }) => dataSources.launchAPI.getLaunchById({ launchId: id }),
    me: (_, __, { dataSources }) => dataSources.userAPI.findOrCreateUser(),
    cart: (_, __, { dataSources }) => dataSources.cartAPI.findOrCreateCart(),
  },
  Mutation: {
    login: async (_, { email }, { dataSources }) => {
      const user = await dataSources.userAPI.findOrCreateUser({ email });
      await dataSources.cartAPI.findOrCreateCart({ userId: user.dataValues.id });
      if (user) return Buffer.from(email).toString('base64');
    },
    bookTrips: async (_, { launchIds }, { dataSources }) => {
      const res = await dataSources.userAPI.bookTrips({ launchIds });
      const launches = await dataSources.launchAPI.getLaunchesByIds({ launchIds });
      
      const success = res.length === launchIds.length;
      return {
        success,
        message: success
          ? 'Trips have booked successfully'
          : `The following trips can't be booked: ${launchIds.filter(id => !res.includes(id))}`,
        launches,
      };
    },
    addToCart: async (_, { launchId }, { dataSources }) => {
      const res = await dataSources.cartAPI.addToCart({ launchId });
      const cart = await dataSources.cartAPI.findOrCreateCart();
      const success = !!res;
      return {
        success,
        cart,
        message: success
          ? 'The launch has added to the cart successfully'
          : `The launch id number ${launchId} can't be added to the cart`,
      };
    },
    removeFromCart: async (_, { launchId }, { dataSources }) => {
      const res = await dataSources.cartAPI.removeFromCart({ launchId });
      const cart = await dataSources.cartAPI.findOrCreateCart();
      const success = !!res;
      return {
        success,
        cart,
        message: success
          ? 'The laucnh has removed from the cart successfully'
          : `The launch id number ${launchId} can't be removed from the cart`,
      };
    },
    clearCart: async (_, __, { dataSources }) => {
      const res = await dataSources.cartAPI.clearCart();
      const cart = await dataSources.cartAPI.findOrCreateCart();
      const success = !!res;
      return { 
        success,
        cart,
        message: success
          ? 'The cart has cleared successfully'
          : 'The cart can\'t be cleared' 
      };
    },
    toggleIsCartShared: async (_, __, { dataSources }) => {
      const res = await dataSources.cartAPI.toggleIsCartShared();
      const cart = await dataSources.cartAPI.findOrCreateCart();
      const success = !!res;

      return {
        success,
        cart,
        message: success
          ? `The cart has toggled to ${cart.dataValues.isShared && 'not'} shared now`
          : 'The cart can\'t be toggled'
      };
    },
    cancelTrip: async (_, { launchId }, { dataSources }) => {
      const res = await dataSources.userAPI.cancelTrip({ launchId });

      if (!res) {
        return {
          success: false,
          message: `Failed to cancel the trip id ${ launchId }`
        };
      }

      const launch = dataSources.launchAPI.getLaunchById({ launchId });
      
      return {
        success: true,
        message: 'Successfully canceled the trip',
        launches: [launch]
      };
    },
  },
  Mission: {
    missionPatch: (mission, { size } = { size: 'LARGE' }) => {
      return size === 'SMALL'
        ? mission.missionPatchSmall
        : mission.missionPatchLarge;
    },
  },
  Launch: {
    isBooked: async (launch, _, { dataSources }) =>
      dataSources.userAPI.isBookedOnLaunch({ launchId: launch.id }),
    isInCart: async (launch, _, { dataSources }) =>
      dataSources.userAPI.isInCartOnLaunch({ launchId: launch.id }),
  },
  User: {
    trips: async (_, __, { dataSources }) => {
      const launchIds = await dataSources.userAPI.getLaunchIdsByUser();

      if (!launchIds.length) return [];

      return (
        dataSources.launchAPI.getLaunchesByIds({
          launchIds,
        }) || []
      );
    },
    cart: async (_, __, { dataSources }) => dataSources.cartAPI.findOrCreateCart(),
  },
  Cart: {
    launches: async (cart, _, { dataSources }) => dataSources.cartAPI.getAllCartLaunches(),
    user: async(cart, _, { dataSources }) => dataSources.userAPI.findOrCreateUser({ userId: cart.id })
  },
};
