import { MongoClient, MongoClientOptions } from 'mongodb';
import { attachDatabasePool } from '@vercel/functions';

const options: MongoClientOptions = {
  appName: "devrel.vercel.integration",
  maxIdleTimeMS: 5000
};

if (!process.env.MONGODB_URI) {
  throw new Error("Please add your Mongo URI to .env.local");
}

const clientPromise = new MongoClient(process.env.MONGODB_URI, options);

// Attach the client to ensure proper cleanup on function suspension
attachDatabasePool(clientPromise);

export default clientPromise;

// Database name
export const DB_NAME = "TajNirvana";

// Collection names
export const COLLECTIONS = {
  //Media Collection
  MEDIA_COLLECTION: "MediaCollection",
  //Tour Collection
  TOURS_COLLECTION: "TourCollection",
  //Category Collection
  CATEGORIES_COLLECTION: "CategoryCollection",
  //Tour Type Collection
  TOUR_TYPES_COLLECTION: "TourTypeCollection",
  //Inclusions Collection
  INCLUSIONS_COLLECTION: "InclusionsCollection",
  //Exclusions Collection
  EXCLUSIONS_COLLECTION: "ExclusionsCollection"
} as const;
