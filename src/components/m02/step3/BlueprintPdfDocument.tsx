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
  row: { flexDirection: "row", borderBottom: "1 solid #E8E8E3" },
  th: { flex: 1, padding: 4, fontSize: 7, color: "#6B6B66" },
  td: { flex: 1, padding: 4, fontSize: 8 },
  id: { fontFamily: "Courier", color: "#0A0E27" },
  instruction: { backgroundColor: "#EFF3FB", padding: 10, borderRadius: 4 },
  card: { backgroundColor: "#FAFAF7", border: "1 solid #E8E8E3", padding: 8, marginBottom: 6 },
  muted: { color: "#6B6B66" },
});

export function BlueprintPdfDocument({
  blueprint,
  generated,
}: {
  blueprint: M02BlueprintData;
  generated: M02GeneratedBlueprint;
}) {
  return (
    <Document title={`${blueprint.useCaseName} Knowledge Base Blueprint`}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.eyebrow}>Generated operational spec</Text>
        <Text style={styles.title}>{blueprint.useCaseName} Knowledge Base Blueprint</Text>
        <Text>{blueprint.useCaseDescription}</Text>

        <View style={styles.section}>
          <Text style={styles.h2}>Section 1 - Index</Text>
          <View style={styles.row}>
            {["ID", "Title", "Layer", "Category", "Source", "Summary"].map((header) => (
              <Text key={header} style={styles.th}>{header}</Text>
            ))}
          </View>
          {blueprint.entries.items.map((entry) => (
            <View key={entry.id} style={styles.row}>
              <Text style={[styles.td, styles.id]}>{entry.id}</Text>
              <Text style={styles.td}>{entry.title}</Text>
              <Text style={styles.td}>{entry.layer}</Text>
              <Text style={styles.td}>{entry.category}</Text>
              <Text style={styles.td}>{entry.source} ({entry.sourceOwner})</Text>
              <Text style={styles.td}>{entry.content.split(". ")[0]}.</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.h2}>Section 2 - Retrieval Instructions</Text>
          <View style={styles.instruction}>
            <Text style={styles.eyebrow}>AI-facing instructions</Text>
            <Text style={styles.h3}>Scope</Text>
            <Text>{blueprint.retrievalInstructions.scope}</Text>
            <Text style={styles.h3}>Retrieval order</Text>
            {blueprint.retrievalInstructions.retrievalOrder.map((item, index) => (
              <Text key={item}>{index + 1}. {item}</Text>
            ))}
            <Text style={styles.h3}>Source precedence</Text>
            {blueprint.retrievalInstructions.sourcePrecedence.map((item, index) => (
              <Text key={item}>{index + 1}. {item}</Text>
            ))}
            <Text style={styles.h3}>Citation</Text>
            <Text>{blueprint.retrievalInstructions.citation}</Text>
            <Text style={styles.h3}>Sensitivity</Text>
            <Text>{blueprint.retrievalInstructions.sensitivity}</Text>
            <Text style={styles.h3}>Boundary behaviour</Text>
            <Text>{blueprint.retrievalInstructions.boundaryBehaviour}</Text>
          </View>
        </View>
      </Page>

      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.h2}>Section 3 - Retrieval Test Suite</Text>
          {blueprint.retrievalTests.tests.map((test) => (
            <View key={test.id} style={styles.card}>
              <Text style={styles.id}>{test.id}</Text>
              <Text style={styles.h3}>{test.question}</Text>
              <Text>Expected entry: {test.expectedEntry}</Text>
              <Text>Expected source: {test.expectedSource}</Text>
              <Text>Expected behaviour: {test.expectedBehaviour}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.h2}>Section 4 - Governance Register</Text>
          {governanceItems(generated).map((item) => (
            <View key={item.title} style={styles.card}>
              <Text style={styles.h3}>{item.title}</Text>
              <Text>{item.note}</Text>
              <Text style={styles.muted}>Action needed: {item.action}</Text>
              <Text style={styles.muted}>Owner-of-the-fix: TBD - team to assign</Text>
              <Text style={styles.muted}>Target date: TBD</Text>
            </View>
          ))}
          <Text style={styles.h3}>Named gaps from Step 2</Text>
          {generated.namedGaps.length ? (
            generated.namedGaps.map((gap) => <Text key={gap}>- {gap}</Text>)
          ) : (
            <Text>- No named gaps recorded.</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.h2}>Section 5 - Forward Path</Text>
          <Text>
            In M04, this blueprint becomes the specification for a real AI assistant. The assistant
            should ingest this index, apply these retrieval instructions, and run this test suite
            before it is trusted in a workflow.
          </Text>
          <Text>
            At Gate 1, the governance register becomes the pre-Build checklist. The team should
            decide which open items must be resolved before building and which can move forward
            with named constraints.
          </Text>
          <Text>
            Your team now has a document that can be handed to a developer, vendor, CIO, or
            internal owner to explain what an AI-ready knowledge base for this process should look
            like.
          </Text>
          <Text>
            Chosen readiness status: {generated.status.toUpperCase()}. {generated.statusExplanation}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
