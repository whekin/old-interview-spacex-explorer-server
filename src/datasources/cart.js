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

    const carts = await this.store.carts.findOrCreate({ where: { userId } });
    return carts && carts[0] ? carts[0] : null;
  }

  async getAllCartLaunches() {
    const userId = this.context.user.id;
    if (!userId) return null;

    const [{ dataValues: { id: cartId } }] = await this.store.carts.findOrCreate({ where: { userId } });
    const cartLaunches = await this.store.cartsLaunches.findAll({ where: { cartId } });

    return cartLaunches.map(cartLaunch => cartLaunch.launchId);
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
}
