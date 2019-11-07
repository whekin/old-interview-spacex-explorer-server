import { DataSource } from 'apollo-datasource';


export default class CartAPI extends DataSource {
  constructor({ store }) {
    super();
    this.store = store;
  }

  initialize({ context }) {
    this.context = context;
  }

  async findOrCreateCart({ userId: userIdArg } = {}) {
    const userId = userIdArg || this.context.user.id;
    if (!userId) return null;

    const carts = await this.store.carts.findOrCreate({
      defaults: { isShared: false },
      where: { userId }
    });
    return carts && carts[0] ? carts[0] : null;
  }

  async findSharedCart({ userId }) {
    const cart = await this.store.carts.findOne({
      where: { userId, isShared: true }
    });
    return cart;
  }

  async getAllCartLaunches({ cart }) {
    const cartLaunches = await this.store.cartsLaunches.findAll({ where: { cartId: cart.id } });

    const launchIds = cartLaunches.map(cartLaunch => cartLaunch.launchId);
    const launches = this.context.dataSources.launchAPI.getLaunchesByIds({ launchIds });

    return launches;
  }

  async addToCart({ launchId }) {
    const userId = this.context.user.id;
    if (!userId) return null;

    const [{ dataValues: { id: cartId } }] = await this.store.carts.findOrCreate({ where: { userId } });
    
    const launch = await this.store.launches.findOrCreate({ where: { id: launchId, cartId } });
    const cartLaunch = await this.store.cartsLaunches.findOrCreate({ where: { cartId , launchId } });

    if (!cartLaunch) return null;

    return launch;
  }

  async removeFromCart({ launchId }) {
    const userId = this.context.user.id;
    if (!userId) return null;

    const [{ dataValues: { id: cartId } }] = await this.store.carts.findOrCreate({ where: { userId } });
    
    const isDestroyedLaunchSuccessfully = await this.store.launches.destroy({ where: { id: launchId, cartId } });

    return isDestroyedLaunchSuccessfully;
  }

  async clearCart() {
    const userId = this.context.user.id;
    if (!userId) return null;

    const [{ dataValues: { id: cartId } }] = await this.store.carts.findOrCreate({ where: { userId } });
    
    const isClearedSuccessfully = await this.store.launches.destroy({ where: { cartId } } );

    return isClearedSuccessfully;
  }

  async toggleIsCartShared() {
    const userId = this.context.user.id;
    if (!userId) return null;

    const [{ dataValues: { isShared: isSharedCurr } }] = await this.store.carts.findOrCreate({ where: { userId } });
    const isUpdatedSuccessfully = await this.store.carts.update({ isShared: !isSharedCurr }, { where: { userId } });

    return isUpdatedSuccessfully;
  }
}
