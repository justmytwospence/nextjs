import { Loader } from "shadcn/ui";

export function Spinner({ className, ...props }) {
  return (
    <Loader className={`animate-spin ${className}`} {...props} />
  );
}
