import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer";
import type { AutomationPlaybookData, Platform } from "@/data/m03/m03Schema";
import { capabilityMatrix } from "@/data/m03/capabilityMatrix";
import { platforms } from "@/data/m03/platforms";
import { setupGuides } from "@/data/m03/setupGuides";
import { crossPlatformReference } from "@/data/m03/crossPlatformReference";
import { competitorPricingMonitor } from "@/data/m03/useCases/competitor-pricing-monitor";
import { promptContractOverlays, promptOptimizerChecklist, v0ToV6Prompts } from "@/data/m03/useCases/competitor-pricing-monitor";
import { genericSkillCreationMetaPrompt, promptImproverSkill } from "@/data/m03/skillTemplate";

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica", fontSize: 10, color: "#1E2B4D" },
  cover: { padding: 40, fontFamily: "Helvetica", color: "#1E2B4D" },
  title: { fontSize: 26, marginBottom: 10 },
  subtitle: { fontSize: 14, color: "#3D3D3A", marginBottom: 20 },
  section: { marginBottom: 18, paddingTop: 10, borderTopWidth: 1, borderTopColor: "#E8E8E3" },
  eyebrow: { fontFamily: "Courier", fontSize: 8, color: "#CF5B2B", textTransform: "uppercase", marginBottom: 6 },
  heading: { fontSize: 16, marginBottom: 8 },
  body: { lineHeight: 1.45, marginBottom: 6 },
  monoBlock: { fontFamily: "Courier", fontSize: 8, backgroundColor: "#EFF3FB", padding: 8, marginTop: 6, lineHeight: 1.35 },
  row: { marginBottom: 4 },
  footer: { position: "absolute", bottom: 20, left: 40, right: 40, fontSize: 8, color: "#6B6B66" },
});

export async function generatePlaybookPDF(data: AutomationPlaybookData): Promise<Blob> {
  return pdf(<PlaybookPDFDocument data={data} />).toBlob();
}

export async function generateSetupGuidePDF(platform: Platform): Promise<Blob | null> {
  const guide = setupGuides[platform];
  if (!guide) return null;
  return pdf(
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.eyebrow}>M03 Setup Guide</Text>
        <Text style={styles.heading}>{guide.title}</Text>
        {guide.sections.map((section) => (
          <View key={section.heading} style={styles.section}>
            <Text style={styles.heading}>{section.heading}</Text>
            <Text style={styles.body}>{section.body}</Text>
          </View>
        ))}
      </Page>
    </Document>,
  ).toBlob();
}

export async function generateCrossPlatformReferencePDF(): Promise<Blob> {
  return pdf(
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.eyebrow}>M03 Reference</Text>
        <Text style={styles.heading}>{crossPlatformReference.title}</Text>
        <Text style={styles.body}>{crossPlatformReference.introText}</Text>
        {Object.entries(capabilityMatrix.matrix).map(([rung, row]) => (
          <Text key={rung} style={styles.row}>
            Rung {rung}: ChatGPT {row.chatgpt === "available" ? "yes" : "no"} · Claude{" "}
            {row.claude === "available" ? "yes" : "no"} · Gemini{" "}
            {row.gemini === "available" ? "yes" : "no"} · Mistral{" "}
            {row.mistral === "available" ? "yes" : "no"} · Copilot{" "}
            {row.copilot === "available" ? "yes" : "no"}
          </Text>
        ))}
        <View style={styles.section}>
          {crossPlatformReference.notes.map((note) => (
            <Text key={note} style={styles.body}>• {note}</Text>
          ))}
        </View>
      </Page>
    </Document>,
  ).toBlob();
}

function PlaybookPDFDocument({ data }: { data: AutomationPlaybookData }) {
  const platform = platforms[data.platform];
  const walked = competitorPricingMonitor.rungs.filter((rung) => data.rungsCovered.includes(rung.rungNumber));

  return (
    <Document>
      <Page size="A4" style={styles.cover}>
        <Text style={styles.eyebrow}>House of Ichigo · M03</Text>
        <Text style={styles.title}>M03 Prompt Contract + Automation Ladder Library</Text>
        <Text style={styles.subtitle}>Six elements, overlays, optimizer checklist, and copy-ready ladder prompts</Text>
        <Text style={styles.body}>Platform: {platform.displayName}</Text>
        <Text style={styles.body}>Generated: {new Date(data.generatedAt).toLocaleString()}</Text>
      </Page>
      <Page size="A4" style={styles.page}>
        <PDFSection title="1. How to use this library">
          <Text style={styles.body}>Chapter: M03 Prompt-driven automation</Text>
          <Text style={styles.body}>Platform: {platform.displayName}</Text>
          <Text style={styles.body}>Rungs walked: {data.rungsCovered.join(", ")}</Text>
          <Text style={styles.monoBlock}>Vague prompt: {competitorPricingMonitor.vaguePrompt}</Text>
        </PDFSection>
        <PDFSection title="2. V0 to V6 prompt progression">
          {v0ToV6Prompts.map((version) => (
            <View key={version.versionLabel} style={styles.section}>
              <Text style={styles.eyebrow}>{version.versionLabel}</Text>
              <Text style={styles.body}>{version.whatImproves}</Text>
              <Text style={styles.monoBlock}>{version.prompt}</Text>
            </View>
          ))}
        </PDFSection>
      </Page>
      <Page size="A4" style={styles.page}>
        <PDFSection title="3. Six-element Prompt Contract">
          <Text style={styles.body}>Goal: {data.promptContract.goal}</Text>
          <Text style={styles.body}>Context: {data.promptContract.context}</Text>
          <Text style={styles.body}>Rules: {data.promptContract.rules.join("; ")}</Text>
          <Text style={styles.body}>Quality bar: {data.promptContract.qualityBar.join("; ")}</Text>
        </PDFSection>
        <PDFSection title="4. Overlays and optimizer checklist">
          <Text style={styles.body}>{promptContractOverlays.style.label}: {promptContractOverlays.style.items.join(", ")}</Text>
          <Text style={styles.body}>{promptContractOverlays.operational.label}: {promptContractOverlays.operational.items.join(", ")}</Text>
          {promptOptimizerChecklist.map((item) => (
            <Text key={item} style={styles.row}>• {item}</Text>
          ))}
        </PDFSection>
        <PDFSection title="5. Prompt Architect Skill download">
          <Text style={styles.body}>
            After seeing that a structured prompt produces better results, the next automation step is saving the improvement method itself as a Skill.
          </Text>
          <Text style={styles.body}>{promptImproverSkill.name}</Text>
          <Text style={styles.body}>{promptImproverSkill.description}</Text>
          <Text style={styles.monoBlock}>{promptImproverSkill.instructions}</Text>
        </PDFSection>
      </Page>
      <Page size="A4" style={styles.page}>
        <PDFSection title="6. Optional Skill-building meta-prompt">
          <Text style={styles.monoBlock}>{genericSkillCreationMetaPrompt}</Text>
        </PDFSection>
        <PDFSection title="7. Skill install note">
          <Text style={styles.body}>Install the Prompt Architect Skill where your platform supports Skills. Otherwise, save the Skill-building meta-prompt and Prompt Contract as templates.</Text>
        </PDFSection>
      </Page>
      <Page size="A4" style={styles.page}>
        <PDFSection title="8. Prompt library by automation rung">
          {walked.map((rung) => (
            <View key={rung.rungNumber} style={styles.section}>
              <Text style={styles.eyebrow}>Rung {rung.rungNumber}</Text>
              <Text style={styles.heading}>{rung.rungName}</Text>
              <Text style={styles.body}>{rung.capability}</Text>
              <Text style={styles.body}>Governance weight: {rung.governanceWeight}/5</Text>
              <Text style={styles.monoBlock}>{rung.promptOrArtifact}</Text>
            </View>
          ))}
        </PDFSection>
        <Text style={styles.footer}>
          M03 Prompt Contract + Automation Ladder Library · {platform.displayName}
        </Text>
      </Page>
    </Document>
  );
}

function PDFSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.heading}>{title}</Text>
      {children}
    </View>
  );
}
