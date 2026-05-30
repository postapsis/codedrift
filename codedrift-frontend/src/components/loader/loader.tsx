/*
 * Author: Jamius Siam
 * Since: 31/05/2026
 */
import type { ComponentProps, JSX } from "react";
import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils.ts";

type LoaderProps = Omit<ComponentProps<typeof LoaderCircle>, "aria-label"> & {
  label?: string;
};

const Loader = ({ className, label = "Loading", ...props }: LoaderProps): JSX.Element => {
  return (
    <LoaderCircle
      {...props}
      role="status"
      aria-label={label}
      className={cn("size-4 animate-spin text-muted-foreground relative bottom-[0.5px]", className)}
    />
  );
};

export default Loader;
