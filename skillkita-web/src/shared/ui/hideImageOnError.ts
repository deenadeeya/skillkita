import type { SyntheticEvent } from "react";

export function hideImageOnError(event: SyntheticEvent<HTMLImageElement>) {
  event.currentTarget.style.display = "none";
}
