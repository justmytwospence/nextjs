import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

const courseTypeLabels = {
	"1": "Run",
	"2": "Ride",
	"4": "Hike",
	"5": "Trail Run",
	"6": "Gravel Ride",
	BackcountrySki: "Backcountry Ski",
	GravelRide: "Gravel Ride",
	NordicSki: "Nordic Ski",
	RockClimbing: "Rock Climbing",
	TrailRun: "Trail Run",
	_all: "All",
	commute: "Commute",
	cyclocross: "Cyclocross",
	gravel: "Gravel Ride",
	indoor: "Indoor",
	mountain: "Mountain",
	other: "Other",
	road: "Road",
	track: "Track",
	trail: "Trail",
	virtual: "Virtual Ride",
};

const getCourseTypeLabel = (type?: string) => type ? courseTypeLabels[type] || type : "All";

type TypeDropdownProps = {
	selectedType?: string;
	courseTypes: string[];
	handleTypeChange: (type?: string) => void;
};

export default function TypeDropdown({
	selectedType,
	courseTypes,
	handleTypeChange,
}: TypeDropdownProps) {
	const sortedCourseTypes = courseTypes.sort((a, b) => getCourseTypeLabel(a).localeCompare(getCourseTypeLabel(b)));

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline">
					{getCourseTypeLabel(selectedType)}
					<ChevronDown className="ml-2 h-4 w-4" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent>
				<DropdownMenuItem onClick={() => handleTypeChange(undefined)}>
					{"All"}
				</DropdownMenuItem>
					{sortedCourseTypes
					.filter((type) => type !== selectedType)
					.map((type) => (
						<DropdownMenuItem key={type} onClick={() => handleTypeChange(type)}>
							{getCourseTypeLabel(type)}
						</DropdownMenuItem>
					))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
