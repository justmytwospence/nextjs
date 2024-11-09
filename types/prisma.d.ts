import { UserActivity, UserRoute } from "@prisma/client";

declare module "@prisma/client" {
  type RequiredFields = {
    id: string;
    name: string;
  }

  type PolylineRequirement = {
    polyline: Json;
    summaryPolyline?: Json;
  } | {
    polyline?: Json;
    summaryPolyline: Json;
  } | {
    polyline: Json;
    summaryPolyline: Json;
  }

  export type Mappable = (
    Pick<UserRoute, 'id' | 'name' | 'polyline' | 'summaryPolyline'> |
    Pick<UserActivity, 'id' | 'name' | 'polyline' | 'summaryPolyline'>) &
    RequiredFields &
    PolylineRequirement;
}