import * as z from "zod";

export const AthleteSchema = z.object({
  "id": z.number(),
  "resource_state": z.number().nullish(),
  "firstname": z.string().nullish(),
  "lastname": z.string().nullish(),
  "profile_medium": z.string().nullish(),
  "profile": z.string().nullish(),
  "city": z.string().nullish(),
  "state": z.string().nullish(),
  "country": z.string().nullish(),
  "sex": z.string().nullish(),
  "premium": z.boolean().nullish(),
  "summit": z.boolean().nullish(),
  "created_at": z.coerce.date().nullish(),
  "updated_at": z.coerce.date().nullish(),
});

export const MapSchema = z.object({
  "id": z.string().nullish(),
  "polyline": z.string().nullish(),
  "summary_polyline": z.string().nullish(),
});

export const AthletePrEffortSchema = z.object({
  "pr_activity_id": z.number().nullish(),
  "pr_elapsed_time": z.number().nullish(),
  "pr_date": z.coerce.date().nullish(),
  "effort_count": z.number().nullish(),
});

export const AthleteSegmentStatsSchema = z.object({
  "id": z.number().nullish(),
  "activity_id": z.number().nullish(),
  "elapsed_time": z.number().nullish(),
  "start_date": z.coerce.date().nullish(),
  "start_date_local": z.coerce.date().nullish(),
  "distance": z.number().nullish(),
  "is_kom": z.boolean().nullish(),
});

export const WaypointSchema = z.object({
  "latlng": z.array(z.number()).nullish(),
  "target_latlng": z.array(z.number()).nullish(),
  "categories": z.array(z.string()).nullish(),
  "title": z.string().nullish(),
  "description": z.string().nullish(),
  "distance_into_route": z.number().nullish(),
});

export const SegmentSchema = z.object({
  "id": z.number().nullish(),
  "name": z.string().nullish(),
  "activity_type": z.string().nullish(),
  "distance": z.number().nullish(),
  "average_grade": z.number().nullish(),
  "maximum_grade": z.number().nullish(),
  "elevation_high": z.number().nullish(),
  "elevation_low": z.number().nullish(),
  "start_latlng": z.array(z.number()).nullish(),
  "end_latlng": z.array(z.number()).nullish(),
  "climb_category": z.number().nullish(),
  "city": z.string().nullish(),
  "state": z.string().nullish(),
  "country": z.string().nullish(),
  "private": z.boolean().nullish(),
  "athlete_pr_effort": AthletePrEffortSchema.nullish(),
  "athlete_segment_stats": AthleteSegmentStatsSchema.nullish(),
});

export const RouteSchema = z.object({
  "athlete": AthleteSchema,
  "description": z.string().nullish(),
  "distance": z.number(),
  "elevation_gain": z.number(),
  "id": z.number(),
  "id_str": z.string(),
  "map": MapSchema,
  "name": z.string(),
  "private": z.boolean(),
  "starred": z.boolean(),
  "timestamp": z.number(),
  "type": z.number(),
  "sub_type": z.number().nullish(),
  "created_at": z.coerce.date(),
  "updated_at": z.coerce.date(),
  "estimated_moving_time": z.number().nullish(),
  "segments": z.array(SegmentSchema).nullish(),
  "waypoints": z.array(WaypointSchema).nullish(),
});

export namespace Strava {
  export type Athlete = z.infer<typeof AthleteSchema>
  export type Map = z.infer<typeof MapSchema>
  export type AthletePrEffort = z.infer<typeof AthletePrEffortSchema>
  export type AthleteSegmentStats = z.infer<typeof AthleteSegmentStatsSchema>
  export type Waypoint = z.infer<typeof WaypointSchema>
  export type Segment = z.infer<typeof SegmentSchema>
  export type Route = z.infer<typeof RouteSchema>
}
