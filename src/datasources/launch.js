import { RESTDataSource } from 'apollo-datasource-rest';

export default class LaunchAPI extends RESTDataSource {
  constructor({ store }) {
    super();
    this.store = store;
    this.baseURL = 'https://api.spacexdata.com/v2/';
  }

  async getAllLaunches() {
    const response = await this.get('launches');

    return Array.isArray(response)
      ? response.map(launch => this.launchReducer(launch))
      : [];
  }

  async getLaunchById({ launchId }) {
    const response = await this.get('launches', { flight_number: launchId });

    return this.launchReducer(response[0]);
  }

  async getAllCartLaunches({ cartId }) {
    const cartLaunches = await this.store.cartsLaunches.findAll({ where: { cartId } });

    const launchIds = cartLaunches.map(cartLaunch => cartLaunch.launchId);
    const launches = await this.getLaunchesByIds({ launchIds });

    return launches;
  }

  getLaunchesByIds({ launchIds }) {
    return Promise.all(
      launchIds.map(launchId => this.getLaunchById({ launchId })),
    );
  }

  launchReducer(launch) {
    return {
      id: launch.flight_number || 0,
      cursor: `${launch.launch_date_unix * 1000}`,
      site: launch.launch_site && launch.launch_site.site_name,
      mission: {
        name: launch.mission_name,
        missionPatchSmall: launch.links.mission_patch_small,
        missionPatchLarge: launch.links.mission_patch,
      },
      rocket: {
        id: launch.rocket.rocket_id,
        name: launch.rocket.rocket_name,
        type: launch.rocket.rocket_type,
      },
      date: new Date(launch.launch_date_unix * 1000).toISOString()
    };
  }
}
