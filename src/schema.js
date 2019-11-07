import { gql } from 'apollo-server';


export default gql`
    scalar DateTime

    type Query {
        launches(pageSize: Int, after: String, from: DateTime, to: DateTime): LaunchConnection!
        launch(id: ID!): Launch
        me: User
        cart: Cart!
    }

    type LaunchConnection {
        cursor: String!
        hasMore: Boolean!
        launches: [Launch]
    }

    type Launch {
        id: ID!
        site: String
        mission: Mission
        rocket: Rocket
        isInCart: Boolean!
        isBooked: Boolean!
        date: DateTime!
    }
    
    type Cart {
        id: ID!
        launches: [Launch!]!
        user: User!
        isShared: Boolean
    }

    type Rocket {
        id: ID!
        name: String
        type: String
    }

    type User {
        id: ID!
        email: String!
        trips: [Launch!]!
        cart: Cart!
    }

    type Mission {
        name: String
        missionPatch(mission: String, size: PatchSize): String
    }

    enum PatchSize {
        SMALL
        LARGE
    }
    
    type Mutation {
        bookTrips(launchIds: [ID]!): TripUpdateResponse!
        cancelTrip(launchId: ID!): TripUpdateResponse!
        login(email: String): String # login token
        addToCart(launchId: ID!): CartUpdateResponse!
        removeFromCart(launchId: ID!): CartUpdateResponse!
        clearCart: CartUpdateResponse!
        toggleIsCartShared: CartUpdateResponse!
    }

    type TripUpdateResponse {
        success: Boolean!
        message: String
        launches: [Launch]
    }

    type CartUpdateResponse {
        success: Boolean!
        message: String
        cart: Cart
    }
`;
