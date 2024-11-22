import type { Activity, Route } from "@prisma/client";
import { Prisma } from "@prisma/client";
import type { LineString } from "geojson";

declare module "@prisma/client" {
	interface MappableActivity extends Activity {
		summaryPolyline: LineString;
		polyline: LineString;
		distance: number;
		totalElevationGain: number;
	}

	interface EnrichedRoute extends Route {
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
