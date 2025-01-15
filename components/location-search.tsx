"use client";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";

interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
}

interface LocationSearchProps {
  onLocationSelect: (center: [number, number]) => void;
}

export default function LocationSearch({
  onLocationSelect,
}: LocationSearchProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

  useEffect(() => {
    const searchPlaces = async () => {
      if (search.length < 3) {
        setResults([]);
        setOpen(false); // Close Popover when search is too short
        return;
      }

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            search
          )}`,
          {
            headers: {
              Accept: "application/json",
              "User-Agent": "PathFinderApp/1.0", // Required by Nominatim usage policy
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setResults(data.slice(0, 5)); // Limit to top 5 results
          setOpen(data.length > 0); // Open Popover if there are results
        }
      } catch (error) {
        console.error("Search error:", error);
        setResults([]);
        setOpen(false); // Close Popover on error
      }
    };

    const debounce = setTimeout(searchPlaces, 1000); // 1 second delay to comply with usage policy
    return () => clearTimeout(debounce);
  }, [search]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < results.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < results.length) {
        const selected = results[highlightedIndex];
        onLocationSelect([
          Number.parseFloat(selected.lon),
          Number.parseFloat(selected.lat),
        ]);
        setOpen(false);
        setSearch("");
        setHighlightedIndex(-1);
      } else if (results.length === 1) {
        const selected = results[0];
        onLocationSelect([
          Number.parseFloat(selected.lon),
          Number.parseFloat(selected.lat),
        ]);
        setOpen(false);
        setSearch("");
        setHighlightedIndex(-1);
      }
    }
  };

  return (
    <div className="w-[250px] relative">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="w-full flex items-center gap-2 px-3 py-2 border rounded-md bg-background text-sm">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              placeholder="Search locations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent border-none outline-none"
            />
          </div>
        </PopoverTrigger>
        <PopoverContent
          className="w-[250px] p-0"
          align="start"
          onKeyDown={handleKeyDown} // Add onKeyDown handler here
          tabIndex={-1} // Make PopoverContent focusable
        >
          <Command>
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup>
                {results.map((result, index) => (
                  <CommandItem
                    key={result.display_name}
                    onSelect={() => {
                      onLocationSelect([
                        Number.parseFloat(result.lon),
                        Number.parseFloat(result.lat),
                      ]);
                      setOpen(false);
                      setSearch("");
                      setHighlightedIndex(-1);
                    }}
                    className={index === highlightedIndex ? "bg-muted" : ""}
                    onMouseEnter={() => setHighlightedIndex(index)}
                  >
                    {result.display_name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
