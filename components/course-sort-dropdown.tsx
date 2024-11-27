import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

const sortOptions = {
	createdAt: "Created At",
	distance: "Distance",
	duration: "Duration",
	elevationGain: "Elevation Gain",
	name: "Name",
} 

export type SortDirection = "asc" | "desc";
export type SortOption = keyof typeof sortOptions;

type SortDropdownProps = {
	sortBy?: SortOption
	sortDir?: SortDirection
	handleSortChange: (value: SortOption) => void;
	handleSortDirToggle: () => void;
};

export default function SortDropdown({
	sortBy = "createdAt",
	sortDir = "asc",
	handleSortChange,
	handleSortDirToggle,
}: SortDropdownProps) {

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline">
					{sortOptions[sortBy]} <ChevronDown className="ml-2 h-4 w-4" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent>
				{Object.entries(sortOptions).map(([key, value]) => 
					<DropdownMenuItem key={key} onClick={() => handleSortChange(key as SortOption)}>
						{value}
					</DropdownMenuItem>
				)}	
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
