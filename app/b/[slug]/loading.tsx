import { BloomLoader } from "@/components/ui/bloom-loader";

export default function Loading() {
  return (
    <main id="main" className="grid min-h-dvh place-items-center px-4">
      <BloomLoader label="Fetching your envelope…" />
    </main>
  );
}
