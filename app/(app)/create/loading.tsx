import { BloomLoader } from "@/components/ui/bloom-loader";

export default function Loading() {
  return (
    <div className="grid min-h-[70dvh] place-items-center px-4">
      <BloomLoader label="Setting out the flowers…" />
    </div>
  );
}
