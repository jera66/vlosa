import { neuSurfaceStyle } from "@/utils/neu";

export function ErrorDisplay({ error, tokens }) {
  if (!error) return null;

  return (
    <div
      className="mb-4 p-4 text-sm"
      style={{
        ...neuSurfaceStyle(tokens, { pressed: true, radius: 16 }),
        color: "#B91C1C",
      }}
    >
      {error}
    </div>
  );
}



