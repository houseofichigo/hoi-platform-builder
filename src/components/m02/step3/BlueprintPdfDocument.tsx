import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { M02BlueprintData, M02GeneratedBlueprint } from "@/data/m02/blueprintSchema";
import { governanceItems } from "./BlueprintGenerator";

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: "#3D3D3A",
    lineHeight: 1.45,
  },
  eyebrow: {
    fontSize: 7,
    color: "#CF5B2B",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 5,
  },
  title: { fontSize: 22, color: "#1E2B4D", marginBottom: 8 },
  section: { marginTop: 18, paddingTop: 10, borderTop: "1 solid #E8E8E3" },
  h2: { fontSize: 15, color: "#1E2B4D", marginBottom: 8 },
  h3: { fontSize: 11, color: "#1E2B4D", marginBottom: 4 },
  card: { backgroundColor: "#FAFAF7", border: "1 solid #E8E8E3", padding: 8, marginBottom: 6 },
  muted: { color: "#6B6B66" },
  id: { fontFamily: "Courier", color: "#0A0E27" },
});

export function BlueprintPdfDocument({
  blueprint,
  generated,
}: {
  blueprint: M02BlueprintData;
  generated: M02GeneratedBlueprint;
}) {
  const { c1, c2, c3 } = blueprint.components;
  return (
    <Document title={`${blueprint.useCaseName} Knowledge Base Blueprint`}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.eyebrow}>Generated operational spec</Text>
        <Text style={styles.title}>{blueprint.useCaseName} Knowledge Base Blueprint</Text>
        <Text>{blueprint.useCaseDescription}</Text>

        <View style={styles.section}>
          <Text style={styles.h2}>C1 - Data Map</Text>
          <View style={styles.card}>
            <Text style={styles.eyebrow}>Raw source</Text>
            <Text style={styles.h3}>{c1.rawSource.name}</Text>
            <Text>Format: {c1.rawSource.format}</Text>
            <Text>Starting state: {c1.rawSource.startingState}</Text>
            <Text>Why AI cannot use it yet: {c1.rawSource.whyAiCannotUseItYet}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.eyebrow}>AI-ready KB entry</Text>
            <Text style={styles.id}>{c1.kbEntry.id}</Text>
            <Text style={styles.h3}>{c1.kbEntry.title}</Text>
            <Text>{c1.kbEntry.content}</Text>
            <Text>Source: {c1.kbEntry.source} ({c1.kbEntry.sourceOwner})</Text>
            <Text>Owner: {c1.dataMapRow.owner}</Text>
            <Text>Sensitivity: {c1.kbEntry.metadata.sensitivity}</Text>
            <Text>Allowed AI use: {c1.kbEntry.metadata.allowedAiUse}</Text>
            <Text>Version: {c1.kbEntry.metadata.version}</Text>
            <Text>Tags: {c1.kbEntry.metadata.tags.join(", ")}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.h2}>C2 - Trust + Safety</Text>
          <Text style={styles.h3}>Source precedence</Text>
          {c2.sourcePrecedence.map((item, index) => (
            <Text key={item}>{index + 1}. {item}</Text>
          ))}
          <Text style={styles.h3}>Access rules</Text>
          {c2.accessRules.map((rule) => (
            <View key={rule.level} style={styles.card}>
              <Text style={styles.h3}>{rule.level}</Text>
              <Text>{rule.appliesTo}</Text>
              <Text>{rule.aiBehaviour}</Text>
            </View>
          ))}
          <Text>Allowed AI behavior: {c2.allowedAiBehaviour}</Text>
          <Text>Escalation boundary: {c2.escalationBoundary}</Text>
        </View>
      </Page>

      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.h2}>C3 - Verification</Text>
          <View style={styles.card}>
            <Text style={styles.id}>{c3.retrievalTest.id}</Text>
            <Text style={styles.h3}>{c3.retrievalTest.userQuestion}</Text>
            <Text>Expected entry: {c3.retrievalTest.expectedEntry}</Text>
            <Text>Expected source: {c3.retrievalTest.expectedSource}</Text>
            <Text>Expected behavior: {c3.retrievalTest.expectedBehaviour}</Text>
          </View>
          <Text style={styles.h3}>Pass criteria</Text>
          {c3.passCriteria.map((item) => <Text key={item}>- {item}</Text>)}
          <Text style={styles.h3}>Readiness review evidence</Text>
          {c3.gateEvidence.map((item) => <Text key={item}>- {item}</Text>)}
        </View>

        <View style={styles.section}>
          <Text style={styles.h2}>Example readiness Decision</Text>
          <Text>
            Example readiness status: {generated.status.toUpperCase()}. {generated.statusExplanation}
          </Text>
          {governanceItems(generated).map((item) => (
            <View key={item.title} style={styles.card}>
              <Text style={styles.h3}>{item.title}</Text>
              <Text>{item.note}</Text>
              <Text style={styles.muted}>Action needed: {item.action}</Text>
              <Text style={styles.muted}>Owner-of-the-fix: TBD - team to assign</Text>
              <Text style={styles.muted}>Target date: TBD</Text>
            </View>
          ))}
          <Text style={styles.h3}>Reference gaps shown in this example</Text>
          {generated.namedGaps.length ? (
            generated.namedGaps.map((gap) => <Text key={gap}>- {gap}</Text>)
          ) : (
            <Text>- Source owner must approve the entry before production.</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.h2}>Forward Path</Text>
          <Text>
            In M04, this blueprint becomes the specification for a real AI assistant. The assistant
            should ingest the C1 entry, apply the C2 trust and safety rules, and run the C3
            verification test before it is trusted in a workflow.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
