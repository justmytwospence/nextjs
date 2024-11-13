import { Activity, UserRoute } from "@prisma/client";

declare module "@prisma/client" {
  type PolylineRequirement =
    | {
        polyline: Json;
        summaryPolyline?: Json;
      }
    | {
        polyline?: Json;
        summaryPolyline: Json;
      };

  export type MappableActivity = Pick<
    Activity,
    "id",
    "name",
    "description",
    "distance",
    "movingTime",
    "totalElevationGain"
  > & { type: "activity" };

  export type Mappable = {
    id: string;
    name: string;
    distance: number;
    description: string;
  } & PolylineRequirement &
    (
      | (Pick<UserRoute, "estimatedMovingTime" | "elevationGain"> & {
          type: "route";
        })
      | MappableActivity
    );
}
