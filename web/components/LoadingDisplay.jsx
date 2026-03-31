import { neuSurfaceStyle } from "@/utils/neu";

export function LoadingDisplay({ isLoading, tokens }) {
  if (!isLoading) return null;

  return (
    <div
      className="mb-4 p-4 text-sm"
      style={neuSurfaceStyle(tokens, { pressed: true, radius: 16 })}
    >
      Loading…
    </div>
  );
}



