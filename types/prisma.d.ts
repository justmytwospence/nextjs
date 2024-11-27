import type { Activity, Route } from "@prisma/client";
import { Prisma } from "@prisma/client";
import type { LineString } from "geojson";

declare module "@prisma/client" {
	interface MappableActivity extends Activity {
		distance: number;
		polyline: LineString | null;
		summaryPolyline: LineString;
		totalElevationGain: number;
	}

	interface EnrichedActivity extends MappableActivity {
		enrichedAt: Date;
		polyline: LineString;
	}

	interface EnrichedRoute extends Route {
		enrichedAt: Date;
		polyline: LineString;
	}

	type Course = {
		courseType: "route" | "activity";
		createdAt: Date;
		description?: string;
		distance: number;
		duration: number;
		elevationGain: number;
		enrichedAt: Date | null;
		id: string;
		name: string;
		polyline?: LineString;
		summaryPolyline: LineString;
		type: string;
	};

	interface EnrichedCourse extends Course {
		enrichedAt: Date;
		polyline: LineString;
	}

	export interface MappableItem {
		id: string;
		name: string;
	}

	export interface Mappable {
		id: string;
		name: string;
		polyline: LineString;
	}
}

declare global {
	namespace PrismaJson {
		type LineStringType = LineString;
	}
}
