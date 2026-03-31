import { NeuButton, neuSurfaceStyle } from "@/utils/neu";

export function AuthGate({ tokens }) {
  return (
    <div
      className="mx-auto w-full max-w-[520px]"
      style={neuSurfaceStyle(tokens, { pressed: false, radius: 18 })}
    >
      <div className="p-6">
        <div className="text-xl font-extrabold">Life Operations System</div>
        <div className="mt-2 text-sm" style={{ color: tokens.subtext }}>
          Sign in to load your personal machine.
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <a href="/account/signin" className="inline-block">
            <NeuButton>Sign in</NeuButton>
          </a>
          <a href="/account/signup" className="inline-block">
            <NeuButton variant="secondary">Sign up</NeuButton>
          </a>
        </div>
      </div>
    </div>
  );
}



