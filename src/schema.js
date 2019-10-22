import { gql } from 'apollo-server';

export default gql`
    type Query {
        launches(pageSize: Int, after: String): LaunchConnection!
        launch(id: ID!): Launch
        me: User
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
        isBooked: Boolean!
    }

    type Rocket {
        id: ID!
        name: String
        type: String
    }

    type User {
        id: ID!
        email: String!
        trips: [Launch]!
    }

    type Mission {
        name: String
        missionPatch(size: PatchSize): String
    }

    enum PatchSize {
        SMALL
        LARGE
    }
    
    type Mutation {
        bookTrips(launchIds: [ID]!): TripUpdateResponse!
        cancelTrip(launchIds: ID!): TripUpdateResponse!
        login(email: String): String # login token
    }

    type TripUpdateResponse {
        success: Boolean!
        message: String
        launches: [Launch]
    }
`;
