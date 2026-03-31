import { NeuCard, NeuInput, neuSurfaceStyle } from "@/utils/neu";

export function PersonaView({ tokens, persona, updatePersonaMutation }) {
  const tone = persona?.tone ? String(persona.tone) : "";
  const structure = persona?.structure ? String(persona.structure) : "";
  const values = persona?.values_and_beliefs
    ? String(persona.values_and_beliefs)
    : "";

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <NeuCard className="p-5">
        <div className="text-sm font-semibold">Persona builder</div>
        <div className="mt-4 grid gap-4">
          <NeuInput
            label="Tone"
            value={tone}
            onChange={(v) => updatePersonaMutation.mutate({ tone: v })}
            placeholder="Direct, warm, professional…"
          />
          <NeuInput
            label="Structure"
            value={structure}
            onChange={(v) => updatePersonaMutation.mutate({ structure: v })}
            placeholder="Bullet points, short sentences…"
          />
          <NeuInput
            label="Values & beliefs"
            value={values}
            onChange={(v) =>
              updatePersonaMutation.mutate({ values_and_beliefs: v })
            }
            placeholder="Prefers clarity…"
          />
        </div>
      </NeuCard>

      <NeuCard className="p-5">
        <div className="text-sm font-semibold">Live preview</div>
        <div
          className="mt-4 p-4"
          style={neuSurfaceStyle(tokens, { pressed: true, radius: 16 })}
        >
          <div
            className="text-xs font-semibold"
            style={{ color: tokens.subtext }}
          >
            How you will write
          </div>
          <div className="mt-2 text-sm">
            • Tone: {tone || "(unset)"}
            <br />• Structure: {structure || "(unset)"}
            <br />• Values: {values || "(unset)"}
            <br />
            <br />
            Example reply:
            <br />
            —
            <br />
            Thanks for the message. Here's the quick update, what's blocked, and
            what I need next.
          </div>
        </div>
      </NeuCard>
    </div>
  );
}



