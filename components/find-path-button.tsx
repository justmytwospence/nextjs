import findPath from "@/app/actions/findPath";
import type { Bounds } from "@/app/actions/findPath";
import { Button } from "@/components/ui/button";
import type { Aspect } from "@/pathfinder/index.d.ts";
import type { LineString, Point } from "geojson";
import { Loader } from "lucide-react";
import { toast } from "sonner";

interface FindPathButtonProps {
  markers: Point[];
  bounds: Bounds | null;
  excludedAspects: Aspect[];
  disabled: boolean;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  setPath: (path: LineString | null) => void;
}

export default function FindPathButton({
  markers,
  bounds,
  excludedAspects,
  disabled,
  isLoading,
  setIsLoading,
  setPath,
}: FindPathButtonProps) {
  async function handleClick() {
    if (!bounds) return;
    setIsLoading(true);
    toast.dismiss();

    try {
      const pathGenerator = await findPath(
        markers[0],
        markers[1],
        bounds,
        excludedAspects
      );

      for await (const result of pathGenerator) {
        switch (result.type) {
          case "info":
            toast.message(result.message);
            break;
          case "success":
            toast.success(result.message);
            break;
          case "warning":
            toast.warning(result.message);
            break;
          case "error":
            toast.error(result.message);
            break;
          case "result":
            setPath(JSON.parse(result.message));
            break;
        }
      }

    } catch (error) {
      // Error handling is already managed by the generator
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button onClick={handleClick} disabled={disabled}>
      {isLoading ? (
        <>
          Find Path
          <Loader className="animate-spin h-4 w-4 ml-2" />
        </>
      ) : (
        "Find Path"
      )}
    </Button>
  );
}
