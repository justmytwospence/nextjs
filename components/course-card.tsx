import LazyMap from "@/components/lazy-map";
import { Card } from "@/components/ui/card";
import type { Course } from "@prisma/client";
import { Clock, Navigation, TrendingUp } from "lucide-react";
import Link from "next/link";

type CourseCardProps = {
	course: Course;
};

export default function CourseCard({ course }: CourseCardProps) {
	return (
		<Link href={`/courses/${course.courseType}/${course.id}`} key={course.id}>
			<Card className="group hover:shadow-lg transition-all duration-200 rounded-lg overflow-hidden hover:cursor-pointer h-full flex flex-col bg-white">
				<div className="relative h-48 w-full">
					<LazyMap polyline={course.summaryPolyline} interactive={false} />
					<div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/80 to-transparent" />
				</div>
				<div className="flex-grow p-4 space-y-3">
					<h3 className="text-lg font-semibold line-clamp-1 group-hover:text-primary transition-colors">
						{course.name}
					</h3>
					<div className="grid grid-cols-3 gap-2">
						<div className="flex items-center gap-2">
							<Navigation className="h-4 w-4 text-muted-foreground" />
							<span className="text-sm">
								{(course.distance / 1609.34).toFixed(1)}mi
							</span>
						</div>
						<div className="flex items-center gap-2 justify-end">
							<TrendingUp className="h-4 w-4 text-muted-foreground" />
							<span className="text-sm">
								{Math.round(course.elevationGain * 3.28084).toLocaleString()} ft
							</span>
						</div>
						<div className="flex items-center gap-2">
							<Clock className="h-4 w-4 text-muted-foreground" />
							<span className="text-sm">
								{Math.round(course.duration / 60).toLocaleString()} min
							</span>
						</div>
					</div>
				</div>
			</Card>
		</Link>
	);
}
