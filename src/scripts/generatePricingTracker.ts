import * as XLSX from "xlsx";
import * as fs from "node:fs";
import * as path from "node:path";

const workbook = XLSX.utils.book_new();

const trackerData = [
  [
    "Competitor",
    "Plan",
    "Monthly Price",
    "Annual Price",
    "Key Features",
    "Limits",
    "Disclaimers",
    "Source URL",
    "Last Checked",
    "Confidence",
  ],
  [
    "Notion",
    "Plus",
    "$10/user/mo",
    "$96/user/yr",
    "Unlimited blocks, file uploads, 30-day version history",
    "Published plan limits apply by workspace",
    "Illustrative starter row; verify current pricing before use",
    "https://www.notion.so/pricing",
    "2026-05-01",
    "High",
  ],
  [
    "Slack",
    "Pro",
    "$8.75/user/mo",
    "$87/user/yr",
    "Unlimited message history, integrations, group huddles",
    "Published plan limits apply by workspace",
    "Illustrative starter row; verify current pricing before use",
    "https://slack.com/pricing",
    "2026-05-01",
    "High",
  ],
  [
    "Linear",
    "Basic",
    "$10/user/mo",
    "$96/user/yr",
    "Issue tracking, projects, cycles, integrations",
    "Published plan limits apply by workspace",
    "Illustrative starter row; verify current pricing before use",
    "https://linear.app/pricing",
    "2026-05-01",
    "High",
  ],
];

XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(trackerData), "Tracker");

const changeLogData = [
  ["Date", "Competitor", "Plan", "Field Changed", "Old Value", "New Value", "Source URL", "Verified By"],
];
XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(changeLogData), "Change Log");

const precedenceData = [
  ["Source Type", "Priority", "Notes"],
  ["Official pricing page", "1 (highest)", "Always preferred when accessible"],
  ["Vendor sales rep quote", "2", "Use only if confirmed in writing"],
  ["Approved partner pricing sheet", "3", "Use when official page is sales-gated"],
  ["Third-party comparison site", "4", "Verify with official source before using"],
  ["Community forum or blog post", "Do not use", "Never cite as authoritative"],
];
XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(precedenceData), "Source Precedence");

const outputPath = path.join(process.cwd(), "public", "downloads", "m03", "pricing-tracker.xlsx");
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
XLSX.writeFile(workbook, outputPath);

console.log(`Pricing tracker generated at ${outputPath}`);

