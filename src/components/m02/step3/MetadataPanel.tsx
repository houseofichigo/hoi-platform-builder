import type { M02BlueprintData } from "@/data/m02/blueprintSchema";

export function MetadataPanel({ blueprint }: { blueprint: M02BlueprintData }) {
  return (
    <div className="space-y-4">
      <p className="text-[14px] leading-relaxed text-graphite">{blueprint.metadata.intro}</p>
      <div className="grid gap-3 md:grid-cols-2">
        <MetadataList title="Required metadata" fields={blueprint.metadata.required} />
        <MetadataList title="Optional advanced metadata" fields={blueprint.metadata.optional} muted />
      </div>
    </div>
  );
}

function MetadataList({
  title,
  fields,
  muted = false,
}: {
  title: string;
  fields: { field: string; description: string }[];
  muted?: boolean;
}) {
  return (
    <div className={`rounded-md border border-chalk p-4 ${muted ? "bg-mist/40" : "bg-paper"}`}>
      <p className="eyebrow-muted">{title}</p>
      <ul className="mt-3 space-y-3">
        {fields.map((item) => (
          <li key={item.field} className="text-[13px] leading-relaxed text-graphite">
            <strong className="text-navy">{item.field}:</strong> {item.description}
          </li>
        ))}
      </ul>
    </div>
  );
}
