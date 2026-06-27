import { useMemo, useState } from "react";
import { Search, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToolCatalog, type ToolCatalogRow, toolCatalogLogoUrl } from "@/lib/db/pfs/tool-catalog";

type OrgTool = {
  id: string;
  name: string;
  category?: string | null;
  catalog_id?: string | null;
};

export function ToolCatalogPicker({
  label,
  value,
  placeholder = "Search tools",
  orgTools,
  triggerOnly,
  includeCatalogFallback,
  onSelectOrgTool,
  onSelectCatalog,
}: {
  label?: string;
  value?: string | null;
  placeholder?: string;
  orgTools?: OrgTool[];
  triggerOnly?: boolean;
  includeCatalogFallback?: boolean;
  catalogSearchOnly?: boolean;
  onSelectOrgTool?: (tool: OrgTool) => void;
  onSelectCatalog?: (tool: ToolCatalogRow) => void;
}) {
  const [search, setSearch] = useState("");
  const catalog = useToolCatalog({ search, triggerOnly });
  const filteredOrgTools = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (orgTools ?? []).filter((tool) => !q || [tool.name, tool.category].filter(Boolean).join(" ").toLowerCase().includes(q));
  }, [orgTools, search]);

  return (
    <div className="space-y-2">
      {label ? <Label className="text-[12px] text-slate">{label}</Label> : null}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate" />
        <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={placeholder} className="pl-9" />
      </div>
      <div className="max-h-64 space-y-1 overflow-auto rounded-md border border-chalk bg-white p-2">
        {filteredOrgTools.map((tool) => (
          <button
            key={tool.id}
            type="button"
            onClick={() => onSelectOrgTool?.(tool)}
            className={[
              "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-[13px] hover:bg-mist",
              value === tool.id ? "bg-mist text-navy" : "text-graphite",
            ].join(" ")}
          >
            <Wrench className="h-4 w-4 text-terracotta" />
            <span className="min-w-0 flex-1 truncate">{tool.name}</span>
            <span className="text-[11px] text-slate">{tool.category}</span>
          </button>
        ))}
        {includeCatalogFallback
          ? (catalog.data ?? []).slice(0, 20).map((tool) => {
              const logo = toolCatalogLogoUrl(tool as any);
              return (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => onSelectCatalog?.(tool)}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-[13px] text-graphite hover:bg-mist"
                >
                  {logo ? <img src={logo} alt="" className="h-4 w-4 object-contain" /> : <Wrench className="h-4 w-4 text-terracotta" />}
                  <span className="min-w-0 flex-1 truncate">{tool.name}</span>
                  <span className="text-[11px] text-slate">{tool.category}</span>
                </button>
              );
            })
          : null}
        {!filteredOrgTools.length && !(catalog.data ?? []).length ? (
          <p className="px-3 py-2 text-[12px] text-slate">{catalog.isLoading ? "Loading tools..." : "No tools found."}</p>
        ) : null}
      </div>
      {value ? (
        <Button type="button" size="sm" variant="ghost" className="text-slate" onClick={() => setSearch("")}>
          Selected
        </Button>
      ) : null}
    </div>
  );
}
