import polyline from "@mapbox/polyline";
import { z } from "zod";

// LatLng - A pair of latitude/longitude coordinates
export const LatLngSchema = z.array(z.number());

// Basic activity type enumeration
export const ActivityTypeSchema = z.enum([
  "AlpineSki", "BackcountrySki", "Canoeing", "Crossfit", "EBikeRide",
  "Elliptical", "Golf", "Handcycle", "Hike", "IceSkate", "InlineSkate",
  "Kayaking", "Kitesurf", "NordicSki", "Ride", "RockClimbing", "RollerSki",
  "Rowing", "Run", "Sail", "Skateboard", "Snowboard", "Snowshoe", "Soccer",
  "StairStepper", "StandUpPaddling", "Surfing", "Swim", "Velomobile",
  "VirtualRide", "VirtualRun", "Walk", "WeightTraining", "Wheelchair",
  "Windsurf", "Workout", "Yoga"
]);

// Enum for sport types, includes new sport types
export const SportTypeSchema = z.enum([
  "AlpineSki", "BackcountrySki", "Badminton", "Canoeing", "Crossfit",
  "EBikeRide", "Elliptical", "EMountainBikeRide", "Golf", "GravelRide",
  "Handcycle", "HighIntensityIntervalTraining", "Hike", "IceSkate",
  "InlineSkate", "Kayaking", "Kitesurf", "MountainBikeRide", "NordicSki",
  "Pickleball", "Pilates", "Racquetball", "Ride", "RockClimbing", "RollerSki",
  "Rowing", "Run", "Sail", "Skateboard", "Snowboard", "Snowshoe", "Soccer",
  "Squash", "StairStepper", "StandUpPaddling", "Surfing", "Swim", "TableTennis",
  "Tennis", "TrailRun", "Velomobile", "VirtualRide", "VirtualRow", "VirtualRun",
  "Walk", "WeightTraining", "Wheelchair", "Windsurf", "Workout", "Yoga",
]);

// Roll-up of metrics for a set of activities
export const ActivityTotalSchema = z.object({
  achievement_count: z.number().int(), // Number of achievements
  count: z.number().int(), // Number of activities in total
  distance: z.number(), // Total distance in meters
  elapsed_time: z.number().int(), // Total elapsed time in seconds
  elevation_gain: z.number(), // Total elevation gain in meters
  moving_time: z.number().int(), // Total moving time in seconds
});

// Returned by GET /athletes/{id}/stats
// Returns activity stats for an athlete
export const ActivityStatsSchema = z.object({
  all_ride_totals: ActivityTotalSchema, // All-time ride stats
  all_run_totals: ActivityTotalSchema, // All-time run stats
  all_swim_totals: ActivityTotalSchema, // All-time swim stats
  biggest_climb_elevation_gain: z.number(), // Highest climb ridden by the athlete
  biggest_ride_distance: z.number(), // Longest distance ridden by the athlete
  recent_ride_totals: ActivityTotalSchema, // Last 4 weeks ride stats
  recent_run_totals: ActivityTotalSchema, // Last 4 weeks run stats
  recent_swim_totals: ActivityTotalSchema, // Last 4 weeks swim stats
  ytd_ride_totals: ActivityTotalSchema, // Year-to-date ride stats
  ytd_run_totals: ActivityTotalSchema, // Year-to-date run stats
  ytd_swim_totals: ActivityTotalSchema, // Year-to-date swim stats
});

// TimedZoneRange - Time spent in a given zone
export const TimedZoneRangeSchema = z.object({
  max: z.number().int(), // Maximum value in the zone range
  min: z.number().int(), // Minimum value in the zone range
  time: z.number().int(), // Time spent in this zone, in seconds
});

// Returned by GET /activities/{id}/zones
// Returns zones for a given activity 
export const ActivityZoneSchema = z.object({
  custom_zones: z.boolean(), // If the zone has custom settings
  distribution_buckets: TimedZoneRangeSchema.array(), // Time distribution across zones
  max: z.number().int(), // Maximum value in the zone
  points: z.number().int(), // Total points accumulated in the zone
  score: z.number().int(), // Score for the activity zone
  sensor_based: z.boolean(), // Whether the zone is sensor-based
  type: z.enum(["heartrate", "power"]), // Zone type (heartrate or power)
});

// Base structure of a data stream
export const BaseStreamSchema = z.object({
  original_size: z.number().int(), // Number of data points in the stream
  resolution: z.enum(["low", "medium", "high"]), // Resolution of the stream
  series_type: z.enum(["distance", "time"]), // Series type for downsampling
});

// Meta information about an athlete
export const MetaAthleteSchema = z.object({
  id: z.coerce.string(), // Unique identifier for the athlete
});

// Details of an activity associated with a club
export const ClubActivitySchema = z.object({
  athlete: MetaAthleteSchema, // Information about the athlete
  distance: z.number(), // Activity distance in meters
  elapsed_time: z.number().int(), // Elapsed time in seconds
  moving_time: z.number().int(), // Moving time in seconds
  name: z.string(), // Name of the activity
  sport_type: ActivityTypeSchema, // Type of sport for the activity
  total_elevation_gain: z.number(), // Total elevation gain in meters
  type: ActivityTypeSchema, // Deprecated, prefer using sport_type
  workout_type: z.number().int().nullable().optional(), // Type of workout, if available
});

//  Information about an athlete in a club
export const ClubAthleteSchema = z.object({
  admin: z.boolean(), // Whether the athlete is an admin
  firstname: z.string(), // Athlete's first name
  lastname: z.string(), // Athlete's last initial
  member: z.string(), // Member status of the athlete
  owner: z.boolean(), // Whether the athlete is the owner
  resource_state: z.number().int(), // Detail level of the resource
});

// Returned by GET /activities/{id}/comments
// Returns comments on an activity
export const CommentSchema = z.object({
  activity_id: z.coerce.string(), // ID of the related activity
  athlete: MetaAthleteSchema, // Information about the athlete making the comment
  created_at: z.string().datetime(), // Date when the comment was created
  id: z.coerce.string(), // Unique identifier for the comment
  text: z.string(), // Content of the comment
});

// Structure for API error information
export const ErrorSchema = z.object({
  code: z.string(), // Error code
  field: z.string(), // Field associated with the error
  resource: z.string(), // Resource type related to the error
});

// Data about an explored segment
export const ExplorerSegmentSchema = z.object({
  avg_grade: z.number(), // Average grade in percentage
  climb_category: z.number().int().min(0).max(5), // Climb difficulty rating (0-5)
  climb_category_desc: z.enum(["NC", "4", "3", "2", "1", "HC"]), // Description of the climb category
  distance: z.number(), // Distance of the segment in meters
  elev_difference: z.number(), // Elevation difference in meters
  end_latlng: LatLngSchema, // Ending latitude and longitude
  id: z.coerce.string(), // Unique identifier for the segment
  name: z.string(), // Name of the segment
  points: z.string(), // Polyline points for the segment
  start_latlng: LatLngSchema, // Starting latitude and longitude
});

// Returned by GET /segments/explore
// Returns matching segments from exploration
export const ExplorerResponseSchema = z.object({
  segments: z.array(ExplorerSegmentSchema), // List of matching segments
});

// Encapsulates API errors
export const FaultSchema = z.object({
  errors: z.array(ErrorSchema), // List of associated errors
  message: z.string(), // Error message
});

// Meta information about an activity
export const MetaActivitySchema = z.object({
  id: z.coerce.string(), // Unique identifier for the activity
});

// Information about a specific lap within an activity
export const LapSchema = z.object({
  activity: MetaActivitySchema, // Associated activity information
  athlete: MetaAthleteSchema, // Athlete who completed the lap
  average_cadence: z.number().optional(), // Average cadence during the lap
  average_speed: z.number(), // Average speed during the lap
  distance: z.number(), // Distance covered in meters
  elapsed_time: z.number().int(), // Elapsed time in seconds
  end_index: z.number().int(), // End index in the activity's stream
  id: z.coerce.string(), // Unique identifier for the lap
  lap_index: z.number().int(), // Index of the lap in the activity
  max_speed: z.number(), // Maximum speed in meters per second
  moving_time: z.number().int(), // Moving time in seconds
  name: z.string(), // Name of the lap
  pace_zone: z.number().int().optional(), // Pace zone during the lap
  split: z.number().int(), // Split number
  start_date: z.string().datetime(), // Start date of the lap
  start_date_local: z.string().datetime(), // Local start date
  start_index: z.number().int(), // Start index in the activity's stream
  total_elevation_gain: z.number(), // Elevation gain in meters
});

// Meta information about a club
export const MetaClubSchema = z.object({
  id: z.coerce.string(), // Unique identifier for the club
  name: z.string(), // Name of the club
  resource_state: z.number().int(), // Detail level of the resource
});

// Summary of a photo
export const PhotosSummaryPrimarySchema = z.object({
  id: z.coerce.string().optional(), // Unique ID for the photo
  source: z.number().int(), // Source identifier
  unique_id: z.coerce.string(), // Unique identifier
  urls: z.record(z.string().url()), // URLs of the photo
});

// Summary of photos associated with an activity
export const PhotosSummarySchema = z.object({
  count: z.number().int(), // Number of photos
  primary: PhotosSummaryPrimarySchema.nullable(), // Primary photo information
});

// Map details including polylines
export const PolylineMapSchema = z.object({
  id: z.coerce.string(), // Identifier for the map
  polyline: z.string().nullable().optional().transform((str) => str ? polyline.toGeoJSON(str) : null).refine((data) => data === null || typeof data === "object", {
    message: "Polyline must be a valid GeoJSON object",
  }), // Full polyline of the map
  summary_polyline: z.string().nullable().optional().transform((str) => str ? polyline.toGeoJSON(str) : null).refine((data) => data === null || typeof data === "object", {
    message: "Polyline must be a valid GeoJSON object",
  }), // Summary polyline of the map
})

// Range structure with minimum and maximum values
export const ZoneRangeSchema = z.object({
  max: z.number().int(), // Maximum value in the range
  min: z.number().int(), // Minimum value in the range
});

// Summary of an athlete's information
export const SummaryAthleteSchema = z.object({
  firstname: z.string(), // Athlete's first name
  id: z.coerce.string(), // Unique identifier of the athlete
  lastname: z.string(), // Athlete's last name
});

// SummaryPRSegmentEffort - Information about a personal record effort on a segment
export const SummaryPRSegmentEffortSchema = z.object({
  effort_count: z.number().int().optional(), // Number of times athlete attempted the segment
  pr_activity_id: z.coerce.string(), // Activity ID for the PR effort
  pr_date: z.string().datetime(), // Date when PR was set
  pr_elapsed_time: z.number().int(), // PR elapsed time in seconds
});

// SummarySegmentEffort - Summary of an effort on a segment
export const SummarySegmentEffortSchema = z.object({
  activity_id: z.coerce.string(), // Activity ID related to this effort
  distance: z.number(), // Effort distance in meters
  elapsed_time: z.number().int(), // Elapsed time of the effort
  id: z.coerce.string(), // Unique identifier of the effort
  is_kom: z.boolean().nullable(), // Whether this effort is a KOM
  start_date: z.string().datetime(), // Start date of the effort
  start_date_local: z.string().datetime(), // Local start date of the effort
});

// Summary of a segment
// Returned by /segments/starred endpoint
export const SummarySegmentSchema = z.object({
  activity_type: z.enum(["Ride", "Run", "BackcountrySki"]), // Type of activity (Ride or Run)
  athlete_pr_effort: SummaryPRSegmentEffortSchema.optional(), // PR effort details if applicable
  athlete_segment_stats: SummarySegmentEffortSchema.optional(), // Segment effort details if available
  average_grade: z.number(), // Average grade in percent
  city: z.string().nullable(), // Segment's city
  climb_category: z.number().int().min(0).max(5), // Climb difficulty rating (0-5)
  country: z.string().nullable(), // Segment's country
  distance: z.number(), // Segment distance in meters
  elevation_high: z.number(), // Highest elevation in meters
  elevation_low: z.number(), // Lowest elevation in meters
  end_latlng: LatLngSchema, // End coordinates (lat/lng)
  id: z.coerce.string(), // Unique identifier of the segment
  maximum_grade: z.number(), // Maximum grade in percent
  name: z.string(), // Segment name
  private: z.boolean(), // Whether the segment is private
  start_latlng: LatLngSchema, // Start coordinates (lat/lng)
  state: z.string(), // Segment's state or region
});

// Waypoint - Details of a waypoint along a route
export const WaypointSchema = z.object({
  categories: z.array(z.string()), // Categories that the waypoint belongs to
  description: z.string().nullable(), // Description of the waypoint (optional)
  distance_into_route: z.number(), // Distance into the route in meters
  latlng: LatLngSchema, // Closest location along the route (lat/lng)
  target_latlng: LatLngSchema.nullable(), // Off-route target location (optional)
  title: z.string(), // Title of the waypoint
});

// Route - Details of a route
export const RouteSchema = z.object({
  athlete: SummaryAthleteSchema, // Athlete information
  created_at: z.string().datetime(), // Route creation date
  description: z.string().nullable(), // Description of the route
  distance: z.number(), // Route distance in meters
  elevation_gain: z.number(), // Total elevation gain in meters
  estimated_moving_time: z.number().int(), // Estimated moving time in seconds
  id: z.number(), // Unique identifier of the route
  id_str: z.string(), // Route ID in string format
  map: PolylineMapSchema, // Map details of the route
  name: z.string(), // Route name
  private: z.boolean(), // Whether the route is private
  segments: z.array(SummarySegmentSchema).nullish(), // Segments traversed by this route
  starred: z.boolean(), // Whether the route is starred
  sub_type: z.number().int().min(1), // Sub-type of the route
  timestamp: z.number().int(), // Epoch timestamp when the route was created
  type: z.number().int().min(1), // Route type (1 for ride, 2 for run)
  updated_at: z.string().datetime(), // Last updated date
  waypoints: WaypointSchema.array(), // Waypoints along the route
}).strict();
export const RoutesSchema = z.array(RouteSchema);

// Split - Information about a split in an activity
export const SplitSchema = z.object({
  average_speed: z.number(), // Average speed in meters per second
  distance: z.number(), // Split distance in meters
  elapsed_time: z.number().int(), // Elapsed time of the split in seconds
  elevation_difference: z.number(), // Elevation difference in meters
  moving_time: z.number().int(), // Moving time for the split in seconds
  pace_zone: z.number().int(), // Pacing zone for the split
  split: z.number().int(), // Split number
});

// SummaryGear - Summary of a gear item
export const SummaryGearSchema = z.object({
  distance: z.number(), // Total distance logged with this gear
  id: z.coerce.string(), // Unique identifier of the gear
  name: z.string(), // Gear name
  primary: z.boolean(), // If this gear is the owner's default
  resource_state: z.number().int(), // Detail level of the resource (2: summary, 3: detail)
});

// Returned in GET /activities/{id}/streams
// Returns activity stream data
export const StreamSetSchema = z.object({
  altitude: z.array(z.number()), // Sequence of altitude values in meters
  cadence: z.array(z.number().int()), // Sequence of cadence values in RPM
  distance: z.array(z.number()), // Sequence of distance values in meters
  grade_smooth: z.array(z.number()), // Sequence of smooth grade values in percent
  heartrate: z.array(z.number().int()), // Sequence of heart rate values
  latlng: LatLngSchema, // Sequence of lat/lng values
  moving: z.array(z.boolean()), // Sequence of moving statuses
  temp: z.array(z.number().int()), // Sequence of temperature values in Celsius
  time: z.array(z.number().int()), // Sequence of time values in seconds
  velocity_smooth: z.array(z.number()), // Sequence of smoothed velocity values
  watts: z.array(z.number().int()), // Sequence of power values in watts
});

// Used in POST /activities for creating activities 
// Used in PUT /activities/{id} for updating activities
export const UpdatableActivitySchema = z.object({
  commute: z.boolean(), // If the activity is marked as a commute
  description: z.string().nullable(), // Activity description
  gear_id: z.coerce.string().nullable(), // Gear ID associated with the activity
  hide_from_home: z.boolean(), // If the activity is muted from the home feed
  name: z.string(), // Activity name
  sport_type: SportTypeSchema, // Sport type of the activity
  trainer: z.boolean(), // If recorded on a training machine
  type: ActivityTypeSchema, // Deprecated, prefer sport_type
});

// Used in POST /uploads and GET /uploads/{uploadId}
export const UploadSchema = z.object({
  activity_id: z.coerce.string().nullable(), // ID of the resulting activity
  error: z.string().nullable(), // Error message if any
  external_id: z.coerce.string().nullable(), // External identifier of the upload
  id: z.coerce.string(), // Unique identifier of the upload
  id_str: z.string(), // Upload ID in string format
  status: z.string(), // Status of the upload
});

// ZoneRanges - Collection of ZoneRange objects
export const ZoneRangesSchema = z.array(ZoneRangeSchema);

// HeartRateZoneRanges - Heart rate zones with custom settings
export const HeartRateZoneRangesSchema = z.object({
  custom_zones: z.boolean(), // If custom zones are set
  zones: ZoneRangesSchema, // List of heart rate zones
});

// PowerZoneRanges - Zones for power levels
export const PowerZoneRangesSchema = z.object({
  zones: ZoneRangesSchema, // List of power zones
});

// Returned in GET /athlete/zones
// Returns athlete heart rate and power zones
export const ZonesSchema = z.object({
  heart_rate: HeartRateZoneRangesSchema, // Heart rate zones
  power: PowerZoneRangesSchema, // Power zones
});

// AltitudeStream - Stream of altitude data points
export const AltitudeStreamSchema = z.object({
  data: z.array(z.number()), // Altitude values in meters
  original_size: z.number().int(), // Number of data points in this stream
  resolution: z.enum(["low", "medium", "high"]), // Sampling resolution
  series_type: z.enum(["distance", "time"]), // Series type for downsampling
});

// CadenceStream - Stream of cadence data points
export const CadenceStreamSchema = z.object({
  data: z.array(z.number().int()), // Cadence values in rotations per minute
  original_size: z.number().int(), // Number of data points in this stream
  resolution: z.enum(["low", "medium", "high"]), // Sampling resolution
  series_type: z.enum(["distance", "time"]), // Series type for downsampling
});

// DetailedGear - Details of a gear item
export const DetailedGearSchema = z.object({
  brand_name: z.string(), // Gear's brand name
  description: z.string().nullable(), // Description of the gear
  distance: z.number(), // Distance logged with this gear
  frame_type: z.number().int(), // Frame type (bike only)
  id: z.coerce.string(), // Unique identifier of the gear
  model_name: z.string(), // Gear's model name
  name: z.string(), // Gear name
  primary: z.boolean(), // If this gear is the owner's default
  resource_state: z.number().int(), // Detail level (2: summary, 3: detail)
});

// Returned by /segments/{id} endpoint
// Detailed information about a segment
export const DetailedSegmentSchema = z.object({
  activity_type: z.enum(["Ride", "Run", "Hike", "BackcountrySki"]), // Type of activity (Ride or Run)
  athlete_count: z.number().int().optional(), // Number of unique athletes with efforts
  athlete_pr_effort: SummaryPRSegmentEffortSchema.optional(), // PR effort details if applicable
  athlete_segment_stats: SummarySegmentEffortSchema.optional(), // Segment effort details if available
  average_grade: z.number(), // Average grade in percent
  city: z.string().nullable(), // Segment's city
  climb_category: z.number().int().min(0), // Climb difficulty rating (0-5)
  country: z.string().nullable(), // Segment's country
  created_at: z.string().datetime().optional(), // Date when the segment was created
  distance: z.number(), // Segment distance in meters
  effort_count: z.number().int().optional(), // Total number of efforts on this segment
  elevation_high: z.number(), // Highest elevation in meters
  elevation_low: z.number(), // Lowest elevation in meters
  end_latlng: LatLngSchema, // End coordinates (lat/lng)
  hazardous: z.boolean(), // If the segment is considered hazardous
  id: z.coerce.string(), // Unique identifier of the segment
  map: PolylineMapSchema.optional(), // Map details
  maximum_grade: z.number(), // Maximum grade in percent
  name: z.string(), // Segment name
  private: z.boolean(), // Whether the segment is private
  star_count: z.number().int().optional(), // Number of stars for this segment
  start_latlng: LatLngSchema, // Start coordinates (lat/lng)
  state: z.string().nullable(), // Segment's state or region
  total_elevation_gain: z.number().optional(), // Total elevation gain in meters
  updated_at: z.string().datetime().optional(), // Date when the segment was last updated
});

// Returned by GET /segment_efforts/{id}
// Returns details of a segment effort
export const DetailedSegmentEffortSchema = z.object({
  activity: z.object({ id: z.coerce.string() }), // Associated activity details
  activity_id: z.coerce.string().optional(), // Activity ID related to this effort
  athlete: z.object({ id: z.coerce.string() }), // Athlete details
  average_cadence: z.number().nullable().optional(), // Average cadence during effort
  average_heartrate: z.number().optional(), // Average heart rate during effort
  average_watts: z.number().nullable().optional(), // Average watts during effort
  device_watts: z.boolean().nullable().optional(), // If wattage is from a power meter
  distance: z.number(), // Effort distance in meters
  elapsed_time: z.number().int(), // Elapsed time of the effort
  end_index: z.number().int(), // End index in activity's stream
  hidden: z.boolean().optional(), // If this effort should be hidden in the activity
  id: z.coerce.string(), // Unique identifier of the effort
  is_kom: z.boolean().optional(), // If this is the current best on leaderboard
  kom_rank: z.number().int().nullable().optional(), // Rank on the global leaderboard if in top 10, can be null
  max_heartrate: z.number().optional(), // Max heart rate during effort
  moving_time: z.number().int(), // Moving time during the effort
  name: z.string(), // Segment name for this effort
  pr_rank: z.number().int().nullable(), // Rank on athlete's leaderboard if in top 3
  segment: DetailedSegmentSchema.optional(), // Detailed segment information
  start_date: z.string().datetime(), // Start date of the effort
  start_date_local: z.string().datetime(), // Local start date of the effort
  start_index: z.number().int(), // Start index in activity's stream
});

// DistanceStream - Stream of distance data points
export const DistanceStreamSchema = z.object({
  data: z.array(z.number()), // Distance values in meters
  original_size: z.number().int(), // Number of data points in this stream
  resolution: z.enum(["low", "medium", "high"]), // Sampling resolution
  series_type: z.enum(["distance", "time"]), // Series type for downsampling
});

// HeartrateStream - Stream of heart rate data points
export const HeartrateStreamSchema = z.object({
  data: z.array(z.number().int()), // Heart rate values in beats per minute
  original_size: z.number().int(), // Number of data points in this stream
  resolution: z.enum(["low", "medium", "high"]), // Sampling resolution
  series_type: z.enum(["distance", "time"]), // Series type for downsampling
});

// LatLngStream - Stream of latitude/longitude points
export const LatLngStreamSchema = z.object({
  data: z.array(LatLngSchema), // Sequence of lat/long values
  original_size: z.number().int(), // Number of data points in this stream
  resolution: z.enum(["low", "medium", "high"]), // Sampling resolution
  series_type: z.enum(["distance", "time"]), // Series type for downsampling
});

// MovingStream - Stream of moving state data points
export const MovingStreamSchema = z.object({
  original_size: z.number().int(), // Number of data points in this stream
  resolution: z.enum(["low", "medium", "high"]), // Sampling resolution
  series_type: z.enum(["distance", "time"]), // Series type for downsampling
  data: z.array(z.boolean()), // Moving state (boolean) values
});

// PowerStream - Stream of power data points
export const PowerStreamSchema = z.object({
  data: z.array(z.number().int()), // Power values in watts
  original_size: z.number().int(), // Number of data points in this stream
  resolution: z.enum(["low", "medium", "high"]), // Sampling resolution
  series_type: z.enum(["distance", "time"]), // Series type for downsampling
});

// SmoothGradeStream - Stream of grade values (smoothed)
export const SmoothGradeStreamSchema = z.object({
  original_size: z.number().int(), // Number of data points in this stream
  resolution: z.enum(["low", "medium", "high"]), // Sampling resolution
  series_type: z.enum(["distance", "time"]), // Series type for downsampling
  data: z.array(z.number()), // Grade values in percent
});

// SmoothVelocityStream - Stream of velocity values (smoothed)
export const SmoothVelocityStreamSchema = z.object({
  data: z.array(z.number()), // Velocity values in meters per second
  original_size: z.number().int(), // Number of data points in this stream
  resolution: z.enum(["low", "medium", "high"]), // Sampling resolution
  series_type: z.enum(["distance", "time"]), // Series type for downsampling
});

// SummaryActivity - Summarized structure of an activity
export const SummaryActivitySchema = z.object({
  achievement_count: z.number().int(), // Number of achievements gained
  athlete: MetaAthleteSchema, // Basic athlete information
  athlete_count: z.number().int(), // Number of athletes involved in the activity
  average_speed: z.number().optional(), // Average speed in meters/second
  average_watts: z.number().optional(), // Average power output in watts (rides only)
  comment_count: z.number().int(), // Number of comments
  commute: z.boolean(), // Whether it's marked as a commute
  device_watts: z.boolean().optional(), // Whether watts are from a power meter
  distance: z.number(), // Distance in meters
  elapsed_time: z.number().int(), // Elapsed time in seconds
  elev_high: z.number().optional(), // Highest elevation in meters, nullable if unknown
  elev_low: z.number().optional(), // Lowest elevation in meters, nullable if unknown
  // end_latlng: z.array(z.number()).optional(), // Ending latitude and longitude
  // external_id: z.coerce.string().nullable(), // Identifier provided at upload time
  flagged: z.boolean(), // Whether it is flagged
  gear_id: z.coerce.string().nullable(), // Gear ID used for the activity
  has_kudoed: z.boolean(), // Whether the logged-in athlete has kudoed this activity
  hide_from_home: z.boolean().optional(), // If the activity is muted
  id: z.coerce.string(), // Unique identifier for the activity
  kilojoules: z.number().optional(), // Work done in kilojoules (rides only)
  kudos_count: z.number().int(), // Number of kudos received
  manual: z.boolean(), // Whether it was created manually
  map: PolylineMapSchema, // Map details
  max_speed: z.number().nullable(), // Maximum speed in meters/second
  max_watts: z.number().int().optional(), // Maximum watts recorded (rides only)
  moving_time: z.number().int(), // Moving time in seconds
  name: z.string(), // Name of the activity
  photo_count: z.number().int(), // Number of Instagram photos
  private: z.boolean(), // Whether it is private
  sport_type: SportTypeSchema, // Sport type of the activity
  start_date: z.string().datetime(), // Start date in UTC
  start_date_local: z.string().datetime(), // Start date in local timezone
  // start_latlng: z.array(z.number()).optional(), // Starting latitude and longitude
  timezone: z.string(), // Timezone of the activity
  total_elevation_gain: z.number(), // Total elevation gain in meters
  total_photo_count: z.number().int(), // Total photos (Instagram + Strava)
  trainer: z.boolean(), // Whether it was recorded on a trainer
  type: ActivityTypeSchema, // Activity type (deprecated, prefer sport_type)
  upload_id: z.coerce.string(), // Identifier of the upload that created this activity
  weighted_average_watts: z.number().int().optional(), // Similar to Normalized Power (rides)
  workout_type: z.number().int().nullable().optional(), // Type of workout
}).strict();
export const SummaryActivitiesSchema = z.array(SummaryActivitySchema);

// SummaryClub - Basic club details
export const SummaryClubSchema = z.object({
  activity_types: z.array(ActivityTypeSchema), // Supported activity types
  city: z.string().nullable(), // Club's city
  country: z.string().nullable(), // Club's country
  cover_photo: z.string().url().nullable(), // Cover photo URL (large)
  cover_photo_small: z.string().url().nullable(), // Cover photo URL (small)
  featured: z.boolean(), // Whether the club is featured
  id: z.coerce.string(), // Unique identifier of the club
  member_count: z.number().int(), // Number of members in the club
  name: z.string(), // Club name
  private: z.boolean(), // Whether the club is private
  profile_medium: z.string().url().nullable(), // URL to a 60x60 pixel profile picture
  resource_state: z.number().int(), // Level of detail
  sport_type: z.enum(["cycling", "running", "triathlon", "other"]).nullable(), // Deprecated
  state: z.string().nullable(), // Club's state or region
  url: z.string().nullable(), // Vanity URL for the club
  verified: z.boolean(), // Whether the club is verified
});

// Returned by GET /activity/{id}
// Detailed information about an activity
export const DetailedActivitySchema = z.object({
  achievement_count: z.number().int(), // Number of achievements gained
  athlete: MetaAthleteSchema, // Basic athlete information
  athlete_count: z.number().int(), // Number of athletes involved in the activity
  average_speed: z.number().optional(), // Average speed in meters/second
  average_watts: z.number().optional(), // Average power output in watts (rides only)
  best_efforts: z.array(DetailedSegmentEffortSchema).optional(), // Collection of best efforts
  calories: z.number().nullable(), // Kilocalories consumed during the activity
  comment_count: z.number().int(), // Number of comments
  commute: z.boolean(), // Whether it's marked as a commute
  description: z.string().nullable(), // Description of the activity
  device_name: z.string().optional(), // Device name used to record the activity
  device_watts: z.boolean().optional(), // Whether watts are from a power meter
  distance: z.number(), // Distance in meters
  elapsed_time: z.number().int(), // Elapsed time in seconds
  elev_high: z.number().optional(), // Highest elevation in meters
  elev_low: z.number().optional(), // Lowest elevation in meters
  embed_token: z.string().nullable(), // Token used to embed a Strava activity
  // end_latlng: LatLngSchema.nullable(), // Ending latitude and longitude
  // external_id: z.coerce.string().nullable(), // Identifier provided at upload time
  flagged: z.boolean(), // Whether it is flagged
  gear: SummaryGearSchema.optional(), // Gear summary
  gear_id: z.coerce.string().nullable(), // Gear ID used for the activity
  has_kudoed: z.boolean(), // Whether the logged-in athlete has kudoed this activity
  hide_from_home: z.boolean(), // If the activity is muted
  id: z.coerce.string(), // Unique identifier of the activity
  kilojoules: z.number().optional(), // Work done in kilojoules (rides only)
  kudos_count: z.number().int(), // Number of kudos received
  laps: z.array(LapSchema).optional(), // Collection of laps
  manual: z.boolean(), // Whether it was created manually
  map: PolylineMapSchema, // Map details
  max_speed: z.number().nullable(), // Maximum speed in meters/second
  max_watts: z.number().int().optional(), // Maximum watts recorded (rides only)
  moving_time: z.number().int(), // Moving time in seconds
  name: z.string(), // Name of the activity
  photo_count: z.number().int(), // Number of Instagram photos
  photos: PhotosSummarySchema.nullable().optional(), // Photos summary
  private: z.boolean(), // Whether it is private
  segment_efforts: z.array(DetailedSegmentEffortSchema).optional(), // Segment efforts
  splits_metric: z.array(SplitSchema).optional(), // Splits in metric units (for runs)
  splits_standard: z.array(SplitSchema).optional(), // Splits in imperial units (for runs)
  sport_type: SportTypeSchema, // Sport type of the activity
  start_date: z.string().datetime(), // Start date in UTC
  start_date_local: z.string().datetime(), // Start date in local timezone
  // start_latlng: LatLngSchema.nullable(), // Starting latitude and longitude
  timezone: z.string(), // Timezone of the activity
  total_elevation_gain: z.number(), // Total elevation gain in meters
  total_photo_count: z.number().int(), // Total photos (Instagram + Strava)
  trainer: z.boolean(), // Whether it was recorded on a trainer
  type: ActivityTypeSchema, // Activity type (deprecated, prefer sport_type)
  upload_id: z.coerce.string(), // Identifier of the upload that created this activity
  weighted_average_watts: z.number().int().optional(), // Similar to Normalized Power (rides)
  workout_type: z.number().int().nullable().optional(), // Type of workout
}).strict();

export type DetailedActivity = z.infer<typeof DetailedActivitySchema>;
export type DetailedSegment = z.infer<typeof DetailedSegmentSchema>;
export type Route = z.infer<typeof RouteSchema>;
export type SummaryActivity = z.infer<typeof SummaryActivitySchema>;
export type SummarySegment = z.infer<typeof SummarySegmentSchema>;