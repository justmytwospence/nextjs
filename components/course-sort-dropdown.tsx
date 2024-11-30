import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, ChevronUp } from "lucide-react";

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
	sortBy: SortOption;
	sortDir: SortDirection;
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
		<div className="flex items-center space-x-2">
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="outline">
						{sortOptions[sortBy]} <ChevronDown className="ml-2 h-4 w-4" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent>
					{Object.entries(sortOptions)
						.filter(([key]) => key !== sortBy)
						.map(([key, value]) => 
							<DropdownMenuItem key={key} onClick={() => handleSortChange(key as SortOption)}>
								{value}
							</DropdownMenuItem>
						)}	
				</DropdownMenuContent>
			</DropdownMenu>
			<Button variant="outline" onClick={handleSortDirToggle}>
				{sortDir === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
			</Button>
		</div>
	);
}
