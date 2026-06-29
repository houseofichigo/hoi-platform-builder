import { useMemo, useState } from "react";
import { Bot, BarChart3, BriefcaseBusiness, Check, Code2, Database, Megaphone, MessageSquare, PiggyBank, Search, Sparkles, Wrench } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  businessToolCategories,
  groupToolCatalog,
  hiddenDefaultToolCategories,
  sortToolCatalogCategories,
  toolCatalogLogoUrl,
  useToolCatalog,
  type ToolCatalogRow,
} from "@/lib/db/pfs/tool-catalog";

type OrgTool = { id: string; name: string; category?: string | null; catalog_id?: string | null };

type PickerRow = {
  id: string;
  name: string;
  category: string;
  triggerCapable: boolean;
  source: "org" | "catalog";
  catalogId?: string | null;
  catalog?: ToolCatalogRow;
};

const categoryIcons = {
  AI: Bot,
  "Analytics & BI": BarChart3,
  Analytics: BarChart3,
  Communication: MessageSquare,
  "Content & Files": Database,
  "Data & Storage": Database,
  "Developer Tools": Code2,
  Development: Code2,
  Accounting: PiggyBank,
  Payments: PiggyBank,
  "Finance & Accounting": PiggyBank,
  Marketing: Megaphone,
  Productivity: BriefcaseBusiness,
  "Sales & CRM": BriefcaseBusiness,
  Sales: BriefcaseBusiness,
  Commerce: BriefcaseBusiness,
  "Customer Support": MessageSquare,
  "Forms & Surveys": ClipboardGlyph,
  "Human Resources": BriefcaseBusiness,
  Miscellaneous: Wrench,
  Other: Wrench,
  Utility: Wrench,
};

function ClipboardGlyph({ className }: { className?: string }) {
  return <Wrench className={className} />;
}

function CategoryIcon({ category, className = "h-4 w-4 text-[var(--ichigo-orange)]" }: { category: string; className?: string }) {
  const Icon = categoryIcons[category as keyof typeof categoryIcons] ?? Wrench;
  return <Icon className={className} />;
}

export function ToolCatalogPicker({
  value,
  values,
  label = "Tool",
  placeholder = "Search tools and platforms",
  orgTools = [],
  triggerOnly = false,
  includeCatalogFallback = true,
  multiSelect = false,
  catalogSearchOnly,
  onSelectCatalog,
  onSelectOrgTool,
  onToggleCatalog,
  onCustomTool,
}: {
  value?: string;
  values?: string[];
  label?: string;
  placeholder?: string;
  orgTools?: OrgTool[];
  triggerOnly?: boolean;
  includeCatalogFallback?: boolean;
  catalogSearchOnly?: boolean;
  multiSelect?: boolean;
  onSelectCatalog?: (tool: ToolCatalogRow) => void | Promise<void>;
  onSelectOrgTool?: (tool: OrgTool) => void | Promise<void>;
  onToggleCatalog?: (tool: ToolCatalogRow) => void;
  onCustomTool?: (name?: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [showMoreCategories, setShowMoreCategories] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<string>("All");
  const catalogQuery = useToolCatalog({ triggerOnly });
  const catalogRows = catalogQuery.data ?? [];
  const fallbackSearchOnly = catalogSearchOnly ?? !multiSelect;
  const selectedCatalogIds = new Set(values ?? []);
  const triggerCatalogIds = useMemo(
    () => new Set(catalogRows.filter((row) => row.trigger_capable).map((row) => row.id)),
    [catalogRows],
  );
  const visibleOrgTools = triggerOnly
    ? orgTools.filter((tool) => tool.catalog_id && triggerCatalogIds.has(tool.catalog_id))
    : orgTools;
  const catalogById = useMemo(() => new Map(catalogRows.map((row) => [row.id, row])), [catalogRows]);
  const selectedOrg = orgTools.find((tool) => tool.id === value);
  const selectedCatalog = catalogRows.find((tool) => tool.id === value);
  const selectedLabel = multiSelect
    ? selectedCatalogIds.size
      ? `${selectedCatalogIds.size} selected`
      : ""
    : selectedOrg?.name ?? selectedCatalog?.name ?? "";

  const orgRows: PickerRow[] = visibleOrgTools.map((tool) => {
    const catalog = tool.catalog_id ? catalogById.get(tool.catalog_id) : undefined;
    return {
      id: tool.id,
      name: tool.name,
      category: tool.category ?? catalog?.category ?? "Custom tools",
      triggerCapable: Boolean(catalog?.trigger_capable),
      source: "org",
      catalogId: tool.catalog_id,
      catalog,
    };
  });
  const orgCatalogIds = new Set(orgTools.map((tool) => tool.catalog_id).filter(Boolean));
  const shouldShowCatalog = includeCatalogFallback && (!fallbackSearchOnly || Boolean(search.trim()));
  const filteredCatalog = shouldShowCatalog
    ? catalogRows.filter((tool) => !orgCatalogIds.has(tool.id))
    : [];
  const searchNeedle = search.trim().toLowerCase();
  const filteredFallbackRows: PickerRow[] = filteredCatalog
    .filter((tool) => selectedCategory === "All" || tool.category === selectedCategory)
    .filter((tool) =>
      selectedRegion === "All"
        ? true
        : (tool.region_relevance ?? []).some(
            (r) => r?.toLowerCase() === selectedRegion.toLowerCase() || r?.toLowerCase() === "global",
          ),
    )
    .filter((tool) => {
      if (!searchNeedle) return !hiddenDefaultToolCategories.includes(tool.category as any) || showMoreCategories || selectedCategory !== "All";
      return `${tool.name} ${tool.category}`.toLowerCase().includes(searchNeedle);
    })
    .map((tool) => ({
      id: tool.id,
      name: tool.name,
      category: tool.category,
      triggerCapable: tool.trigger_capable,
      source: "catalog" as const,
      catalogId: tool.id,
      catalog: tool,
    }));
  const fallbackGroups = groupToolCatalog(filteredFallbackRows.map((row) => row.catalog!).filter(Boolean));
  const categories = sortToolCatalogCategories([...new Set(catalogRows.map((row) => row.category))]);
  const primaryCategories = categories.filter((category) => !hiddenDefaultToolCategories.includes(category as any));
  const moreCategories = categories.filter((category) => hiddenDefaultToolCategories.includes(category as any));
  const regions = useMemo(() => {
    const set = new Set<string>();
    for (const row of catalogRows) (row.region_relevance ?? []).forEach((r) => r && set.add(r));
    return ["EU", "US", "UK", "APAC", "Global", ...Array.from(set)]
      .filter((v, i, arr) => arr.indexOf(v) === i)
      .filter((r) => r !== "All");
  }, [catalogRows]);
  const selectedRows = catalogRows.filter((row) => selectedCatalogIds.has(row.id));

  const choose = async (row: PickerRow) => {
    if (row.source === "org") {
      const tool = orgTools.find((item) => item.id === row.id);
      if (tool && onSelectOrgTool) await onSelectOrgTool(tool);
      if (!multiSelect) setOpen(false);
      return;
    }
    const tool = catalogRows.find((item) => item.id === row.id);
    if (!tool) return;
    if (multiSelect) {
      onToggleCatalog?.(tool);
    } else if (onSelectCatalog) {
      await onSelectCatalog(tool);
      setOpen(false);
    }
  };

  return (
    <div className="space-y-2">
      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--slate)]">{label}</p>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="h-11 w-full justify-between rounded-[var(--r-md)] border-[var(--chalk)] bg-white px-3 text-left font-sans text-[14px] font-normal text-[var(--ichigo-navy)]"
          >
            <span className={selectedLabel ? "" : "text-[var(--slate)]"}>{selectedLabel || placeholder}</span>
            <Search className="h-4 w-4 text-[var(--slate)]" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[min(820px,calc(100vw-2rem))] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput placeholder={placeholder} value={search} onValueChange={setSearch} />
            <div className="border-b border-[var(--chalk)] p-3">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {["All", ...primaryCategories].map((category) => (
                  <CategoryChip key={category} active={selectedCategory === category} onClick={() => setSelectedCategory(category)}>
                    {category}
                  </CategoryChip>
                ))}
                {moreCategories.length ? (
                  <CategoryChip active={showMoreCategories} onClick={() => setShowMoreCategories((current) => !current)}>
                    More
                  </CategoryChip>
                ) : null}
                {showMoreCategories
                  ? moreCategories.map((category) => (
                      <CategoryChip key={category} active={selectedCategory === category} onClick={() => setSelectedCategory(category)}>
                        {category}
                      </CategoryChip>
                    ))
                  : null}
              </div>
              <div className="mt-2 flex items-center gap-2 overflow-x-auto pb-1">
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--slate)]">Region</span>
                {["All", ...regions].map((region) => (
                  <CategoryChip key={region} active={selectedRegion === region} onClick={() => setSelectedRegion(region)}>
                    {region}
                  </CategoryChip>
                ))}
              </div>
              {multiSelect && selectedRows.length ? (
                <div className="mt-3 flex flex-wrap gap-2 rounded-[var(--r-md)] bg-[var(--paper)] p-2">
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--slate)]">Selected ({selectedRows.length})</span>
                  {selectedRows.slice(0, 8).map((tool) => (
                    <button
                      key={tool.id}
                      type="button"
                      onClick={() => onToggleCatalog?.(tool)}
                      className="rounded-full bg-white px-2 py-1 font-sans text-[11px] text-[var(--ichigo-navy)]"
                    >
                      {tool.name}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <CommandList className="max-h-[520px]">
              <CommandEmpty>
                <div className="space-y-3 py-6 text-center text-sm">
                  <p>No matching tool.</p>
                  {onCustomTool ? (
                    <Button type="button" variant="outline" onClick={() => onCustomTool(search)} className="rounded-[var(--r-md)] border-[var(--chalk)]">
                      Add custom tool
                    </Button>
                  ) : null}
                </div>
              </CommandEmpty>
              {orgRows.length && !multiSelect ? (
                <CommandGroup heading="Selected for this company">
                  <div className="grid gap-2 p-1 sm:grid-cols-2 lg:grid-cols-3">
                    {orgRows.map((row) => (
                      <ToolTile key={`org-${row.id}`} row={row} selected={value === row.id} onSelect={() => choose(row)} />
                    ))}
                  </div>
                </CommandGroup>
              ) : null}
              {!multiSelect && fallbackSearchOnly && !search.trim() ? (
                <CommandGroup heading={orgRows.length ? "Catalog search" : "No company tools yet"}>
                  <div className="m-1 rounded-[var(--r-md)] border border-dashed border-[var(--chalk)] bg-[var(--paper)] p-4 font-sans text-[13px] text-[var(--slate)]">
                    {orgRows.length
                      ? "Search to add another tool from the full catalog."
                      : "Search the full catalog to add a tool to this company stack."}
                  </div>
                </CommandGroup>
              ) : null}
              {sortToolCatalogCategories(Object.keys(fallbackGroups)).map((category) => (
                <CommandGroup key={category} heading={`${orgRows.length && !multiSelect ? "Add from catalog · " : ""}${category}`}>
                  <div className="grid gap-2 p-1 sm:grid-cols-2 lg:grid-cols-3">
                    {fallbackGroups[category].map((tool) => (
                      <ToolTile
                        key={`catalog-${tool.id}`}
                        row={{
                          id: tool.id,
                          name: tool.name,
                          category: tool.category,
                          triggerCapable: tool.trigger_capable,
                          source: "catalog",
                          catalogId: tool.id,
                          catalog: tool,
                        }}
                        selected={multiSelect ? selectedCatalogIds.has(tool.id) : value === tool.id}
                        onSelect={() =>
                          choose({
                            id: tool.id,
                            name: tool.name,
                            category: tool.category,
                            triggerCapable: tool.trigger_capable,
                            source: "catalog",
                            catalogId: tool.id,
                            catalog: tool,
                          })
                        }
                      />
                    ))}
                  </div>
                </CommandGroup>
              ))}
              {onCustomTool ? (
                <CommandGroup heading="Custom">
                  <CommandItem value={`custom ${search}`} onSelect={() => onCustomTool(search)} className="m-1 rounded-[var(--r-md)] border border-dashed border-[var(--ichigo-orange)] p-3">
                    <Wrench className="h-4 w-4 text-[var(--ichigo-orange)]" />
                    <span>Add a custom tool{search.trim() ? `: ${search.trim()}` : ""}</span>
                  </CommandItem>
                </CommandGroup>
              ) : null}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {catalogQuery.isLoading ? <p className="font-sans text-[12px] text-[var(--slate)]">Loading catalog...</p> : null}
      {catalogQuery.error ? <p className="font-sans text-[12px] text-[var(--danger)]">Catalog unavailable. Custom tools still work.</p> : null}
    </div>
  );
}

function CategoryChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full border px-3 py-1.5 font-sans text-[12px] font-medium ${
        active
          ? "border-[var(--ichigo-navy)] bg-[var(--ichigo-navy)] text-white"
          : "border-[var(--chalk)] bg-white text-[var(--ichigo-navy)]"
      }`}
    >
      {children}
    </button>
  );
}

function ToolTile({
  row,
  selected,
  onSelect,
}: {
  row: PickerRow;
  selected: boolean;
  onSelect: () => void;
}) {
  const logoUrl = toolCatalogLogoUrl(row.catalog);
  const [logoFailed, setLogoFailed] = useState(false);
  const description = row.catalog?.description ?? null;
  const regions = row.catalog?.region_relevance ?? [];
  const departments = row.catalog?.departments ?? [];
  return (
    <CommandItem
      value={`${row.name} ${row.category} ${row.source}`}
      onSelect={onSelect}
      className={`min-h-24 items-start rounded-[var(--r-md)] border bg-white p-3 ${
        selected ? "border-[var(--ichigo-orange)] ring-2 ring-[var(--ichigo-orange)]/25" : "border-[var(--chalk)]"
      }`}
    >
      <div className="flex w-full gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--r-sm)] border border-[var(--chalk)] bg-[var(--paper)]">
          {logoUrl && !logoFailed ? (
            <img src={logoUrl} alt="" className="h-7 w-7 object-contain" onError={() => setLogoFailed(true)} />
          ) : (
            <CategoryIcon category={row.category} className="h-5 w-5 text-[var(--ichigo-orange)]" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <span className="line-clamp-2 font-sans text-[13px] font-semibold leading-4 text-[var(--ichigo-navy)]">{row.name}</span>
            {selected ? <Check className="ml-auto h-4 w-4 shrink-0 text-[var(--ichigo-orange)]" /> : <Sparkles className="ml-auto h-4 w-4 shrink-0 text-transparent" />}
          </div>
          <p className="mt-1 truncate font-sans text-[11px] text-[var(--slate)]">{row.category}</p>
          {description ? (
            <p className="mt-1 line-clamp-2 font-sans text-[11px] leading-snug text-[var(--graphite)]">{description}</p>
          ) : null}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {row.triggerCapable ? (
              <Badge className="rounded-full bg-[var(--ichigo-mist)] px-2 py-0.5 text-[10px] text-[var(--ichigo-navy)]">Trigger</Badge>
            ) : null}
            {row.source === "catalog" ? (
              <Badge className="rounded-full bg-[var(--paper)] px-2 py-0.5 text-[10px] text-[var(--slate)]">Catalog</Badge>
            ) : null}
            {regions.slice(0, 2).map((r) => (
              <Badge key={`region-${r}`} className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] text-emerald-700">{r}</Badge>
            ))}
            {departments.slice(0, 2).map((d) => (
              <Badge key={`dept-${d}`} className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] text-sky-700">{d}</Badge>
            ))}
          </div>
        </div>
      </div>
    </CommandItem>
  );
}
