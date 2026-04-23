import type { Confidence } from "../types/domain";
import { Badge } from "./ui/Badge";

export function ConfidenceBadge({ value }: { value: Confidence }) {
  const tone =
    value === "Committed"
      ? "good"
      : value === "Likely"
        ? "brand"
        : value === "Pipeline"
          ? "warn"
          : value === "Stretch"
            ? "bad"
            : "neutral";
  return <Badge tone={tone}>{value}</Badge>;
}
