import * as z from "zod";

export const AthleteSchema = z.object({
  "city": z.string().nullish(),
  "country": z.string().nullish(),
  "created_at": z.coerce.date().nullish(),
  "firstname": z.string().nullish(),
  "id": z.number(),
  "lastname": z.string().nullish(),
  "premium": z.boolean().nullish(),
  "profile": z.string().nullish(),
  "profile_medium": z.string().nullish(),
  "resource_state": z.number().nullish(),
  "sex": z.string().nullish(),
  "state": z.string().nullish(),
  "summit": z.boolean().nullish(),
  "updated_at": z.coerce.date().nullish(),
});

export const MapSchema = z.object({
  "id": z.string(),
  "polyline": z.string().nullish(),
  "resource_state": z.number().nullish(),
  "summary_polyline": z.string().nullish(),
}).refine(data => data.polyline || data.summary_polyline, {
  message: "Either polyline or summary_polyline must be provided",
});

export const AthletePrEffortSchema = z.object({
  "effort_count": z.number(),
  "pr_activity_id": z.number(),
  "pr_date": z.coerce.date(),
  "pr_elapsed_time": z.number(),
});

export const RouteSegmentStatsSchema = z.object({
  "activity_id": z.number().nullish(),
  "distance": z.number().nullish(),
  "elapsed_time": z.number().nullish(),
  "id": z.number().nullish(),
  "is_kom": z.boolean().nullish(),
  "start_date": z.coerce.date().nullish(),
  "start_date_local": z.coerce.date().nullish(),
});

export const WaypointSchema = z.object({
  "categories": z.array(z.string()).nullish(),
  "description": z.string().nullish(),
  "distance_into_route": z.number().nullish(),
  "latlng": z.array(z.number()).nullish(),
  "target_latlng": z.array(z.number()).nullish(),
  "title": z.string().nullish(),
});

// A view on an athlete's stats for a particular segment in a route
export const AthleteRouteSegmentStatsSchema = z.object({
  "activity_id": z.number(),
  "distance": z.number(),
  "elapsed_time": z.number(),
  "id": z.number(),
  "is_kom": z.boolean(),
  "start_date": z.coerce.date(),
  "start_date_local": z.coerce.date(),
});

// A view on a segment for a particular athlete's route
export const AthleteRouteSegmentSchema = z.object({
  "activity_type": z.string(),
  "athlete_pr_effort": AthletePrEffortSchema,
  "athlete_segment_stats": AthleteRouteSegmentStatsSchema,
  "average_grade": z.number(),
  "city": z.string(),
  "climb_category": z.number(),
  "country": z.string(),
  "distance": z.number(),
  "elevation_high": z.number(),
  "elevation_low": z.number(),
  "end_latlng": z.string(),
  "id": z.number(),
  "maximum_grade": z.number(),
  "name": z.string(),
  "private": z.boolean(),
  "start_latlng": z.string(),
  "state": z.string(),
});

// An overall view on an athlete's stats for a particular segment
export const AthleteSegmentStatsSchema = z.object({
  "effort_count": z.number(),
  "pr_date": z.string(),
  "pr_elapsed_time": z.number(),
});

// A overall view on a segment for a particular athlete
export const AthleteSegmentSchema = z.object({
  "activity_type": z.string(),
  "athlete_count": z.number(),
  "athlete_segment_stats": AthleteSegmentStatsSchema,
  "average_grade": z.number(),
  "city": z.string(),
  "climb_category": z.number(),
  "country": z.string(),
  "created_at": z.coerce.date(),
  "distance": z.number(),
  "effort_count": z.number(),
  "elevation_high": z.number(),
  "elevation_low": z.number(),
  "end_latlng": z.array(z.number()),
  "hazardous": z.boolean(),
  "id": z.number(),
  "map": MapSchema,
  "maximum_grade": z.number(),
  "name": z.string(),
  "private": z.boolean(),
  "resource_state": z.number(),
  "star_count": z.number(),
  "starred": z.boolean(),
  "start_latlng": z.array(z.number()),
  "state": z.string(),
  "total_elevation_gain": z.number(),
  "updated_at": z.coerce.date(),
});

export const AthleteRouteSchema = z.object({
  "athlete": AthleteSchema,
  "created_at": z.coerce.date(),
  "description": z.string(),
  "distance": z.number(),
  "elevation_gain": z.number(),
  "estimated_moving_time": z.number(),
  "id": z.number(),
  "id_str": z.string(),
  "map": MapSchema,
  "name": z.string(),
  "private": z.boolean(),
  "segments": z.array(AthleteRouteSegmentSchema).nullish(),
  "starred": z.boolean(),
  "sub_type": z.number(),
  "timestamp": z.number(),
  "type": z.number(),
  "updated_at": z.coerce.date(),
  "waypoints": z.array(WaypointSchema).nullish(),
});

export type Athlete = z.infer<typeof AthleteSchema>;
export type Map = z.infer<typeof MapSchema>;
export type AthletePrEffort = z.infer<typeof AthletePrEffortSchema>;
export type Waypoint = z.infer<typeof WaypointSchema>;
export type AthleteRoute = z.infer<typeof AthleteRouteSchema>;
export type AthleteSegment = z.infer<typeof AthleteSegmentSchema>;
export type AthleteRouteSegment = z.infer<typeof AthleteRouteSegmentSchema>;