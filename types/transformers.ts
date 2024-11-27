import type {
	Activity,
	Course,
	EnrichedActivity,
	EnrichedCourse,
	EnrichedRoute,
	MappableActivity,
	Route,
} from "@prisma/client";

export function isMappableActivity(
	activity: Activity,
): activity is MappableActivity {
	return activity.summaryPolyline !== null;
}

export function isEnrichedActivity(
	activity: MappableActivity,
): activity is EnrichedActivity {
	return activity.enrichedAt !== null;
}

export function isEnrichedRoute(route: Route): route is EnrichedRoute {
	return route.enrichedAt !== null;
}

export function isEnrichedCourse(course: Course): course is EnrichedCourse {
	return course.enrichedAt !== null;
}

function routeToCourse(route: EnrichedRoute): EnrichedCourse;
function routeToCourse(route: Route): Course;
function routeToCourse(route: Route | EnrichedRoute): Course | EnrichedCourse {

	return {
		courseType: "route" as const,
		createdAt: route.createdAt,
		description: route?.description ?? undefined,
		distance: route.distance,
		duration: route.estimatedMovingTime,
		elevationGain: route.elevationGain,
		enrichedAt: route.enrichedAt,
		id: route.id.toString(),
		name: route.name,
		polyline: route.polyline ?? undefined,
		summaryPolyline: route.summaryPolyline,
		type: route.type?.toString() ?? "Unknown",
	} 
}
export { routeToCourse };

function activityToCourse(activity: EnrichedActivity): EnrichedCourse;
function activityToCourse(activity: MappableActivity): Course;
function activityToCourse(
	activity: MappableActivity | EnrichedActivity,
): Course | EnrichedCourse {

	return {
		courseType: "activity" as const,
		createdAt: activity.startDate,
		description: activity?.description ?? undefined,
		distance: activity.distance,
		duration: activity.movingTime,
		elevationGain: activity.totalElevationGain,
		id: activity.id.toString(),
		name: activity.name,
		summaryPolyline: activity.summaryPolyline,
		type: activity.sportType,
		enrichedAt: activity.enrichedAt,
		polyline: activity.polyline ?? undefined,
	};

}
export { activityToCourse };
