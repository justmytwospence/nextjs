import { Spinner } from "@/components/ui/spinner";

export default function Loading() {
  return (
    <div className="flex items-center justify-center h-screen">
      <Spinner className="text-gray-500 w-32 h-32" />
    </div>
  );
}
