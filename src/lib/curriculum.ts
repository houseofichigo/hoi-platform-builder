export type CurriculumPhase = 'scope' | 'build' | 'govern' | 'scale';
export type ModuleId = 'm01' | 'm02' | 'm03' | 'm04' | 'm05' | 'm06' | 'm07' | 'm08' | 'm09' | 'm10' | 'm11' | 'm12';
export type GateNumber = 1 | 2 | 3;
export type GateRole = 'pre' | 'g1' | 'g2' | 'g3' | 'post1' | 'post2' | 'post3';
export type AssessCourseId = 'ai-transformation-foundations';

export type CoursePrimaryMedia =
  | {
      type: 'youtube';
      url: string;
      embedUrl: string;
      title: string;
    }
  | {
      type: 'slides';
      url: string;
      title: string;
      format: 'pptx' | 'pdf' | 'google_slides';
    };

export interface ModuleMeta {
  id: ModuleId;
  num: number;
  title: string;
  subtitle: string;
  phase: CurriculumPhase;
  phaseNum: number;
  phaseName: string;
  steps: number;
  prereq: ModuleId | null;
  duration: string;
  estimatedMinutes: number;
  gateRole: GateRole;
  gateNumber: GateNumber | null;
  deliverable: string;
  description: string;
  objectives: string[];
  keySections?: string[];
  concepts: { term: string; definition: string }[];
  assignment: string;
  outcome: string;
  assignmentAlignment?: string;
}

export interface CapstoneCaseMeta {
  id: string;
  function: string;
  title: string;
  workflow: string;
  agent: string;
  why: string;
}

export interface AssessCourseMeta {
  id: AssessCourseId;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  audience: string;
  level: string;
  duration: string;
  framing: string;
  modules: ModuleId[];
  primaryMedia: CoursePrimaryMedia;
  moduleMedia: Record<ModuleId, CoursePrimaryMedia>;
  methodology: string;
  artifacts: string[];
  gates: string[];
  formats: { label: string; duration: string; coverage: string }[];
  certification: {
    tier1: string;
    tier2: string;
    assessment: string;
  };
  capstoneCases: CapstoneCaseMeta[];
}

export const MODULES: ModuleMeta[] = [
  {
    id: 'm01', num: 1, title: 'LLM Fundamentals',
    subtitle: 'From tools to systems: what language models do, how they work, where they fail.',
    phase: 'scope', phaseNum: 1, phaseName: 'Scope',
    steps: 2, prereq: null, duration: '1h 45m', estimatedMinutes: 105,
    gateRole: 'pre', gateNumber: null,
    deliverable: 'Comparison notes + hallucination log + readiness self-assessment.',
    description: 'Understand what language models do, how they work, and how to know when your organisation is ready to use them.',
    objectives: [
      'Explain LLM mechanics: tokenisation, context windows, temperature',
      'Distinguish between Tool, Assistant, Agent, and System levels',
      'Identify hallucination as a governance problem',
      'Compare model capability tables across providers',
      'Self-assess organisational AI readiness across six pillars',
    ],
    keySections: [
      'Prediction and probability',
      'Operational implications of context windows',
      'The Four-Level Spectrum: Tool → System',
      'Hallucination: causes and governance',
      'Six-pillar readiness self-assessment',
    ],
    concepts: [
      { term: 'Hallucination', definition: 'When an AI model produces output that sounds confident but is factually wrong or invented. Models hallucinate because they predict the next likely word, not the next true word.' },
      { term: 'Temperature', definition: 'Controls randomness. Low (0.1) = predictable and factual. High (0.9) = creative but sometimes off-topic.' },
      { term: 'Top-k & Top-p', definition: "Two ways to limit the model's word choices. Both reduce randomness without going as flat as low temperature." },
    ],
    assignment: 'Run two short prompt experiments — one to provoke a hallucination, one to feel how generation parameters change the same answer.',
    outcome: 'A working mental model of LLM behavior plus your first method note: where confidently-wrong AI would be dangerous in your company.',
  },
  {
    id: 'm02', num: 2, title: 'Data Readiness & Preparation',
    subtitle: 'Connect, govern, and prepare the data your AI system will use.',
    phase: 'scope', phaseNum: 1, phaseName: 'Scope',
    steps: 4, prereq: 'm01', duration: '1h 15m', estimatedMinutes: 75,
    gateRole: 'pre', gateNumber: null,
    deliverable: 'Completed three-layer data map.',
    description: 'Identify internal, contextual and task-specific data sources; apply ownership, lineage, quality and access governance; classify by EU/HOI regime (GDPR, ISO 42001, EU AI Act, security/sector regulator where relevant).',
    objectives: [
      'Identify data sources: Internal, Contextual, Task-specific',
      'Apply governance: Ownership, Lineage, Quality, Access',
      'Classify data by EU/HOI regime (GDPR, ISO 42001, EU AI Act, security/sector regulator where relevant)',
      'Produce a three-layer data map for a candidate process',
    ],
    keySections: [
      'The three-layer data model',
      'Data residency and transfer',
      'Audit trail requirements',
      'Synthetic data as a safe alternative',
    ],
    concepts: [
      { term: 'Internal data', definition: 'Data that lives inside your organisation — the fields your systems of record use.' },
      { term: 'Contextual data', definition: 'External rules and regulations the assistant must respect — laws, mandates, industry-specific requirements.' },
      { term: 'Task-specific data', definition: 'The examples used to test the system — clean cases, edge cases, difficult formats.' },
    ],
    assignment: 'Inventory the internal records, the regulatory and process rules, and a deliberate set of edge-case examples for the worked example.',
    outcome: 'A three-layer data map you can hand to any builder — and a list of the gaps that need filling before Build.',
  },
  {
    id: 'm03', num: 3, title: 'Prompt-Driven Automation',
    subtitle: 'From one-off prompts to reusable, governed, automation-ready workflow assets.',
    phase: 'scope', phaseNum: 1, phaseName: 'Scope',
    steps: 4, prereq: 'm02', duration: '1h 45m', estimatedMinutes: 105,
    gateRole: 'pre', gateNumber: null,
    deliverable: 'Three documented Prompt Contracts + library entries + test suites + automation layer decisions.',
    description: 'Move from one-off prompts into reusable, governed workflow assets. Apply the Prompt Contract, document tests, and choose the right automation layer per task.',
    objectives: [
      'Apply the Prompt Contract: Goal, Context, Rules, Output, Quality Bar, Examples',
      'Distinguish six task types: extraction, classification, summarization, transformation, evaluation, guardrail',
      'Document prompts as reusable library entries with test suites and version control',
      'Map the 10-rung automation ladder and choose the right rung per task',
    ],
    keySections: [
      'The Prompt Contract: six elements, applied',
      'Six task-type demos on varied business cases',
      'Prompt library entries, test suites, quality bars',
      'Automation ladder: files, connectors, search, agents, scheduled tasks',
    ],
    concepts: [
      { term: 'Placement vs task type', definition: 'Placement (user · system · context · workflow) defines authority. Task type (search · extract · classify · generate · summarise · transform · reason · evaluate · guard) defines behaviour. Decide both before writing any prompt.' },
      { term: 'Six-element framework', definition: 'Task · Role · Context · Constraints · Output format · Examples. Each element removes one kind of uncertainty.' },
      { term: 'Prompt optimizer workflow', definition: 'Draft → optimize → test → revise → document. The optimizer is the six-element framework applied as a checklist to surface what is missing.' },
      { term: 'Prompt as security surface', definition: 'Two risks: prompt injection (untrusted content tries to override instructions) and data leakage (sensitive data sent where it should not go). Mitigated by separating instructions from data, using system prompts for control logic, validating outputs, and limiting sensitive data exposure.' },
    ],
    assignment: 'Build the Prompt Contract for three different task types — one extraction, one classification, one guardrail — each on a different business task. Document each as a library entry with test suite and automation layer decision.',
    outcome: 'Three Prompt Contracts with reusable library entries, test suites, and automation layer decisions.',
    assignmentAlignment: 'Current app assignment still uses the earlier three-layer prompt set: schema search, context deep research, and mock data generation. Rewrite this assignment next to match the v6 task-type Prompt Contract.',
  },
  {
    id: 'm04', num: 4, title: 'AI Assistants & RAG',
    subtitle: 'Configure assistants grounded in your data. Apply Gate 1 as an informal readiness check.',
    phase: 'build', phaseNum: 2, phaseName: 'Build',
    steps: 5, prereq: 'm03', duration: '2h 30m', estimatedMinutes: 150,
    gateRole: 'g1', gateNumber: 1,
    deliverable: 'Assistant blueprint + source checklist + five test outputs + RAG governance notes + Gate 1 decision with reason codes.',
    description: 'Build assistants as governed configurations: purpose, sources, constraints, outputs, and tests. Apply Gate 1 with evidence and reason codes.',
    objectives: [
      'Define an assistant as a governed configuration and apply the six-part anatomy',
      'Build RAG with diagnostic discipline and identify the six failure modes',
      'Run the five-query test set: standard, missing, boundary, conflict, unsafe',
      'Apply Gate 1 with reason codes: proceed, redesign with named fixes, or stop',
    ],
    keySections: [
      'Assistant anatomy: design before tool choice',
      'RAG depth: embeddings, retrieval, six failure modes, RAG vs fine-tuning',
      'Four RAG governance dimensions: indexing, access, retention, change',
      'Gate 1 evidence pack: five-query test set + reason codes + decision',
    ],
    concepts: [
      { term: 'Assistant architecture', definition: 'A useful assistant is not just a prompt. It has instructions, knowledge sources, retrieval behaviour, tool boundaries, and evaluation tests.' },
      { term: 'RAG', definition: 'Retrieval-Augmented Generation: the assistant retrieves relevant knowledge at query time, then generates an answer grounded in that retrieved context.' },
      { term: 'Knowledge base', definition: 'The assistant-readable body of evidence: schema knowledge, contextual rules, examples, policies, test cases, and known limitations.' },
      { term: 'Gate 1', definition: 'Informal readiness check after the assistant build: is this safe and useful enough to build the prototype layer on? Continue, continue with constraints, improve, or stop.' },
    ],
    assignment: 'Build a grounded assistant on a small reference dataset. Run the five-query test set, document RAG governance, and apply Gate 1 with a named PASS / PARTIAL / FAIL decision and reason codes if not PASS.',
    outcome: 'Assistant blueprint, source checklist, five test outputs, RAG governance notes, and Gate 1 decision.',
    assignmentAlignment: 'Current app assignment has the assistant/RAG evidence flow but still frames the source pack around the invoice OCR worked example. Add explicit v6 reason-code language during the assignment-content pass.',
  },
  {
    id: 'm05', num: 5, title: 'Prototyping with No-Code',
    subtitle: 'Build the application your agent will operate inside.',
    phase: 'build', phaseNum: 2, phaseName: 'Build',
    steps: 3, prereq: 'm04', duration: '1h 40m', estimatedMinutes: 100,
    gateRole: 'post1', gateNumber: null,
    deliverable: 'Working prototype + 3-item requirement list.',
    description: 'Build the application your agent will operate inside. Use a no-code prototype to bridge assistant evaluation and agent design.',
    objectives: [
      'Explain why a prototype bridges assistant evaluation and agent design',
      'Define the four prototype surfaces: upload, review, approve, audit',
      'Write a no-code build brief using sandbox governance and mock data only',
      'Run a stakeholder walkthrough and record friction points',
      'Translate prototype gaps into three agent requirement cards for M06',
    ],
    keySections: [
      'No-code landscape: Lovable, Bubble, Retool',
      'Four components of the OCR prototype',
      'What the prototype fakes vs. what is real',
      'Sandbox boundaries and the path to Gate 2',
    ],
    concepts: [
      { term: 'Prototype', definition: 'A working interface that demonstrates a workflow, not a production system. It uses mock data, simplified logic, and explicit visual cues.' },
      { term: 'Four surfaces', definition: 'Upload, review, approve, audit: the minimum interface loop for AI-supported invoice processing.' },
      { term: 'Sandbox governance', definition: 'Prototype rules: mock data only, no real PII, no production integrations, no hidden automation, and clear labels when outputs are simulated.' },
      { term: 'Agent requirements', definition: 'The gap between what the prototype fakes and what the real agent must do with tools, memory, approvals, and auditability.' },
    ],
    assignment: 'Build a working no-code prototype of a simple two-screen workflow, such as intake form plus review dashboard. Walk through it and document three agent requirements.',
    outcome: 'Working prototype and three agent requirement cards grounded in the walkthrough.',
    assignmentAlignment: 'Current app assignment uses a structured no-code brief rather than a live prototype. Keep this safe for now; later add a clear optional Lovable build handoff.',
  },
  {
    id: 'm06', num: 6, title: 'AI Agents & Pilot',
    subtitle: 'Build the working agent. Apply Gate 2 as an informal pilot-readiness check.',
    phase: 'build', phaseNum: 2, phaseName: 'Build',
    steps: 5, prereq: 'm05', duration: '3h 00m', estimatedMinutes: 180,
    gateRole: 'g2', gateNumber: 2,
    deliverable: 'Working AI agent + pilot metrics report + Gate 2 decision.',
    description: 'Build a multi-step agent, connect tools through controlled integrations, evaluate against a baseline, and apply Gate 2 as an informal readiness check.',
    objectives: [
      'Distinguish assistant behaviour from agent action',
      'Configure a multi-step workflow in n8n',
      'Integrate external tools via Model Context Protocol-style tool definitions',
      'Design Human-in-the-Loop triggers and escalation rules',
      'Measure pilot outcomes: precision, recall, confidence calibration',
      'Apply Gate 2 informally: governance rules, HITL, security, monitoring',
    ],
    keySections: [
      'Agent architecture: logic, tools, memory',
      'The n8n workflow environment',
      'MCP integration and tool definitions',
      'HITL design patterns and escalation paths',
      'Evaluation: precision, recall, confidence thresholds',
      'Gate 2 walkthrough: is it safe to deploy?',
    ],
    concepts: [
      { term: 'AI agent', definition: 'An AI system that can pursue a goal through steps, tool calls, memory, and state. It can take action, so its boundary must be explicit.' },
      { term: 'MCP-style integration', definition: 'A controlled way for an agent to access external systems through named tools, permissions, schemas, logs, and revocation rules.' },
      { term: 'HITL', definition: 'Human-in-the-loop checkpoints where the agent must pause, explain, and request approval before continuing.' },
      { term: 'Pilot boundary', definition: 'The agreed limit for who, what data, what systems, what time window, and what rollback path are included in the pilot.' },
    ],
    assignment: 'Build a live agent for a low-risk task. Connect one tool via MCP, run 10 representative inputs, measure accuracy against a baseline, and apply Gate 2.',
    outcome: 'Working AI agent, pilot metrics report, and Gate 2 decision.',
    assignmentAlignment: 'Current app assignment safely simulates the agent pilot with blueprints, policies, and generated defaults. Later content should clarify where live MCP/n8n work is optional or facilitator-led.',
  },
  {
    id: 'm07', num: 7, title: 'Tools & Platforms',
    subtitle: 'Choose the AI stack that meets your governance requirements — before it becomes a liability.',
    phase: 'govern', phaseNum: 3, phaseName: 'Govern',
    steps: 4, prereq: 'm06', duration: '2h 00m', estimatedMinutes: 120,
    gateRole: 'post2', gateNumber: null,
    deliverable: 'Comparison matrix + Tool Selection ADR + stack decision.',
    description: 'Choose the AI stack that meets governance requirements before it becomes a liability. Compare capability, cost, governance, and production fit.',
    objectives: [
      'Compare platforms on capability, cost, and governance',
      'Apply six governance criteria to any tool',
      'Validate or replace the pilot stack for production',
      'Document tool selection using an Architecture Decision Record',
    ],
    keySections: [
      'Tool choice as a governance decision',
      'Platform walkthroughs: ChatGPT, Claude, Google AI Studio, Perplexity',
      'Governance comparison: data residency, training opt-out, MCP support',
      'From pilot stack to production stack: validate or replace',
    ],
    concepts: [
      { term: 'Tool choice as governance', definition: 'Tool selection determines where data goes, who can access it, what is logged, and how failures are investigated.' },
      { term: 'Governance criteria', definition: 'Data residency, training opt-out, MCP/tool support, audit logs, compliance certifications, vendor stability, cost, and operational fit.' },
      { term: 'ADR', definition: 'Architecture Decision Record: a short decision document naming context, options, decision, rationale, consequences, and review date.' },
      { term: 'Pilot-to-production gap', definition: 'The distance between a tool that works in a controlled pilot and a tool that can survive production governance.' },
    ],
    assignment: 'Validate a candidate stack against six production governance criteria. Compare two platforms head-to-head and write a Tool Selection ADR.',
    outcome: 'Comparison matrix, Tool Selection ADR, and stack decision.',
    assignmentAlignment: 'Current app already follows the comparison/ADR structure. Later polish should remove the remaining required justification prose.',
  },
  {
    id: 'm08', num: 8, title: 'Integration & Deployment Planning',
    subtitle: 'Architecture decisions, security, and cost modelling for the path to production.',
    phase: 'govern', phaseNum: 3, phaseName: 'Govern',
    steps: 4, prereq: 'm07', duration: '1h 30m', estimatedMinutes: 90,
    gateRole: 'post2', gateNumber: null,
    deliverable: '1-2 page Integration Plan.',
    description: 'Make architecture decisions, identify security risks, and model cost for the path to production.',
    objectives: [
      'Make deployment architecture choices: local vs cloud, open vs managed',
      'Map data flows across app, assistant, agent, storage, accounting, and audit systems',
      'Identify and mitigate the top three deployment security risks',
      'Estimate cost across tokens, infrastructure, licensing, and operations',
      'Write a partner-ready integration and rollback plan',
    ],
    keySections: [
      'Architecture Decision Records (ADRs)',
      'Security at scale: auth, secrets, data flow',
      'Cost modelling: tokens, infrastructure, licensing',
      'Deployment readiness: compliance, rollback',
    ],
    concepts: [
      { term: 'Architecture decision', definition: 'A consequential technical choice documented with context, alternatives, rationale, consequences, and review date.' },
      { term: 'Data-flow control', definition: 'Knowing where data enters, where it is stored, who can access it, where it leaves, and how it is deleted.' },
      { term: 'Security at scale', definition: 'Authentication, secrets management, signed webhooks, audit logs, least privilege, and incident response.' },
      { term: 'Cost model', definition: 'Expected spend across LLM tokens, OCR/API usage, compute, storage, licensing, support, and human review time.' },
    ],
    assignment: 'Produce an integration plan for a candidate system: architecture choice, top three risks, and cost estimate.',
    outcome: 'A 1-2 page Integration Plan.',
    assignmentAlignment: 'Current app includes architecture, security, cost, rollback, and handoff. Keep the richer structure, but reduce required cost notes in the assignment-content pass.',
  },
  {
    id: 'm09', num: 9, title: 'AI Portfolio Scoring & Use Case Prioritisation',
    subtitle: 'Apply the formal scoring engine. Gate 3 turns the result into an investment decision.',
    phase: 'govern', phaseNum: 3, phaseName: 'Govern',
    steps: 5, prereq: 'm08', duration: '2h 00m', estimatedMinutes: 120,
    gateRole: 'g3', gateNumber: 3,
    deliverable: 'Scored portfolio (4 use cases) + step-automation maps + Gate 3 decisions.',
    description: 'Apply the formal scoring engine. Gate 3 turns the result into an investment decision across the portfolio.',
    objectives: [
      'Apply Capture → Prioritise → Map methodology at portfolio scale',
      'Score four use cases against the eight-pillar engine',
      'Use reason codes to make constraints and blockers explicit',
      'Create step-level automation maps for each candidate',
      'Apply Gate 3 as a formal investment decision across the portfolio',
    ],
    keySections: [
      'From informal gates to formal scoring',
      'Four-block Capture: Identify · Data & Tools · Workflow · Safety & Limits',
      'Eight-pillar engine scoring and reason codes',
      'stepAutomationMap and gateStatus interpretation',
      'Gate 3 walkthrough: which use cases earn the next investment?',
    ],
    concepts: [
      { term: 'Eight-pillar engine', definition: 'Business Impact, Feasibility, Process Maturity, Risk, AI Suitability, Agent Suitability, Delivery Readiness, and Priority.' },
      { term: 'Reason codes', definition: 'Traceable labels that explain why a use case is blocked, constrained, or preferred.' },
      { term: 'Automation map', definition: 'A step-by-step process view showing what is manual, assisted, automated, or forbidden.' },
      { term: 'Gate 3', definition: 'Formal portfolio investment decision: fund, fund with constraints, defer, or stop.' },
    ],
    assignment: 'Score four candidate use cases formally through the engine. Apply Gate 3 to all four and decide which earns the next investment cycle.',
    outcome: 'Scored four-use-case portfolio, step-automation maps, and Gate 3 decisions.',
    assignmentAlignment: 'Current app includes candidate scoring and Gate 3 dossier. Later align language to v6 formal portfolio decisions and the Build scoring engine.',
  },
  {
    id: 'm10', num: 10, title: 'Documentation & Adoption',
    subtitle: 'Make the system survivable across teams with playbooks and handoffs.',
    phase: 'scale', phaseNum: 4, phaseName: 'Scale',
    steps: 3, prereq: 'm09', duration: '1h 30m', estimatedMinutes: 90,
    gateRole: 'post3', gateNumber: null,
    deliverable: 'Documentation Pack: outline · playbook · handoff plan.',
    description: 'Make the system survivable across teams with playbooks and handoffs.',
    objectives: [
      'Document AI at three layers: architecture, decisions, governance',
      'Write a system card aligned with EU AI Act, GDPR, and ISO 42001 expectations',
      'Produce an operating playbook for non-engineers',
      'Distinguish tacit knowledge from explicit operating instructions',
      'Design a five-stage handoff: review, shadow, joint, backup, ownership',
    ],
    keySections: [
      'Model cards vs. system cards',
      'EU AI Act compliance documentation',
      'The five-stage handoff: review → shadow → joint → backup → ownership',
      'Tacit vs. explicit knowledge',
    ],
    concepts: [
      { term: 'System card', definition: 'A system card documents the complete AI system in context: purpose, boundaries, data, users, risks, monitoring, and human oversight.' },
      { term: 'EU AI Act governance documentation', definition: 'High-impact AI documentation patterns: intended purpose, data, validation, monitoring, human oversight, risk controls, GDPR posture, and change management.' },
      { term: 'Tacit vs explicit knowledge', definition: 'Tacit knowledge lives in the builder’s head. Explicit knowledge is written so another operator can run, debug, and improve the system.' },
      { term: 'Five-stage handoff', definition: 'Review → Shadow → Joint → Backup → Ownership. Responsibility transfers gradually instead of by ceremony.' },
    ],
    assignment: 'Produce a documentation outline, a 2-3 page operating playbook, and a handoff plan for any candidate system.',
    outcome: 'Documentation Pack: outline, playbook, and handoff plan.',
    assignmentAlignment: 'Current app still produces a system card, which remains useful as supporting evidence. Later make the outline/playbook/handoff framing primary.',
  },
  {
    id: 'm11', num: 11, title: 'Monitoring & Quality',
    subtitle: 'Detect drift, calibrate alerts, feed re-scoring decisions back into the portfolio.',
    phase: 'scale', phaseNum: 4, phaseName: 'Scale',
    steps: 4, prereq: 'm10', duration: '2h 30m', estimatedMinutes: 150,
    gateRole: 'post3', gateNumber: null,
    deliverable: '1-page Monitoring Plan + drift trigger spec + portfolio re-scoring criteria.',
    description: 'Define monitoring metrics across performance, accuracy, drift, and fairness. Calibrate alert thresholds and escalation paths, document drift response, and specify when production signals trigger portfolio re-scoring.',
    objectives: [
      'Define metrics across performance, accuracy, drift, and fairness',
      'Design alert thresholds and escalation paths',
      'Detect and categorise data, concept, and model drift',
      'Write an incident response path for monitoring failures',
      'Trigger portfolio re-scoring on significant drift events',
    ],
    keySections: [
      'Monitoring categories and alert tiers',
      'Drift detection and incident response',
      'Operating the scoring engine in production',
      'Feedback loops: from production data to portfolio decisions',
    ],
    concepts: [
      { term: 'Monitoring categories', definition: 'Four tiers: performance, accuracy, drift, and fairness. A healthy system watches all four.' },
      { term: 'Drift types', definition: 'Data drift changes inputs, concept drift changes meaning, model drift changes behaviour. Each needs a different response.' },
      { term: 'Alert tiers', definition: 'Info, warning, critical, and stop conditions. Alerts must route to a named owner, not a vague team.' },
      { term: 'Re-scoring trigger', definition: 'A production threshold that sends the use case back to the M09 scoring engine because its risk, value, or readiness changed.' },
    ],
    assignment: 'Define metrics for a candidate system. Configure alert thresholds. Identify drift conditions that would trigger portfolio re-scoring.',
    outcome: 'A 1-page Monitoring Plan with drift triggers, escalation paths, and re-scoring criteria.',
    assignmentAlignment: 'Current app is close to v6. Later simplify any remaining required prose into generated monitoring and drift summaries.',
  },
  {
    id: 'm12', num: 12, title: 'AI Strategy & Roadmap',
    subtitle: 'Turn one scored portfolio into a 12-month investment roadmap that an executive sponsor can sign.',
    phase: 'scale', phaseNum: 4, phaseName: 'Scale',
    steps: 4, prereq: 'm11', duration: '1h 30m', estimatedMinutes: 90,
    gateRole: 'post3', gateNumber: null,
    deliverable: 'AI Strategy Roadmap: 12-month plan + capability gap analysis + executive summary.',
    description: 'Synthesize the scored portfolio from M09 into a sequenced 12-month AI roadmap. Translate technical capability into business outcomes, identify gaps across people/tools/partnerships, design an executive scorecard, and plan the next pilot cycle.',
    objectives: [
      'Synthesize the scored portfolio from M09 into a sequenced 12-month roadmap',
      'Translate technical capability into business outcomes for executive sponsors',
      'Identify capability gaps across people, tools, and partnerships',
      'Design an executive scorecard for AI program health',
      'Plan the next pilot cycle with explicit go/no-go criteria',
    ],
    keySections: [
      'From portfolio to roadmap: sequencing scored use cases',
      'The three horizons: now · next · later',
      'Capability development plan: people, tools, partnerships',
      'Executive scorecard and KPI alignment',
      'Securing investment and managing sponsor expectations',
    ],
    concepts: [
      { term: 'Portfolio to roadmap', definition: 'The roadmap sequences scored use cases by readiness, dependencies, investment, and organisational capacity.' },
      { term: 'Three horizons', definition: 'Now (0-3 months), Next (3-9 months), Later (9-12 months). The planning frame for AI investment.' },
      { term: 'Capability gaps', definition: 'The missing people, tools, partnerships, governance, or operating routines required to scale.' },
      { term: 'Executive scorecard', definition: 'A one-page view of program health: live systems, pilots, governance status, risk posture, investment, and impact.' },
    ],
    assignment: 'Build a 12-month AI roadmap using the scored portfolio from M09. Include sequencing, capability gaps, investment estimates, and a one-page executive summary.',
    outcome: 'AI Strategy Roadmap, capability gap analysis, and executive summary.',
    assignmentAlignment: 'Current app includes an executive scorecard as a strong supporting artifact. Later review whether it stays required or becomes supporting evidence.',
  },
];

export const PHASES = [
  { num: 1, id: 'scope' as const, name: 'Scope', subtitle: 'Understand. Prepare. Practise.', modules: ['m01', 'm02', 'm03'] as ModuleId[], artifact: 'The Foundation' },
  { num: 2, id: 'build' as const, name: 'Build', subtitle: 'Assistant. Prototype. Agent.', modules: ['m04', 'm05', 'm06'] as ModuleId[], artifact: 'The System' },
  { num: 3, id: 'govern' as const, name: 'Govern', subtitle: 'Choose. Plan. Score.', modules: ['m07', 'm08', 'm09'] as ModuleId[], artifact: 'The Operating Plan' },
  { num: 4, id: 'scale' as const, name: 'Scale', subtitle: 'Document. Monitor. Roadmap.', modules: ['m10', 'm11', 'm12'] as ModuleId[], artifact: 'The Handoff Pack' },
];

export const ARTIFACTS = [
  { id: 'foundation', phase: 1, phaseName: 'Scope', title: 'The Foundation', modules: ['m01', 'm02', 'm03'] as ModuleId[] },
  { id: 'system', phase: 2, phaseName: 'Build', title: 'The System', modules: ['m04', 'm05', 'm06'] as ModuleId[] },
  { id: 'operating_plan', phase: 3, phaseName: 'Govern', title: 'The Operating Plan', modules: ['m07', 'm08', 'm09'] as ModuleId[] },
  { id: 'handoff_pack', phase: 4, phaseName: 'Scale', title: 'The Handoff Pack', modules: ['m10', 'm11', 'm12'] as ModuleId[] },
];

export const DEFAULT_ASSESS_COURSE_ID = 'ai-transformation-foundations' as const;

export const COURSES: AssessCourseMeta[] = [
  {
    id: DEFAULT_ASSESS_COURSE_ID,
    slug: DEFAULT_ASSESS_COURSE_ID,
    title: 'AI Transformation Foundations',
    subtitle: 'The first House of Ichigo Assess course.',
    description:
      'A twelve-module course across four phases, anchored by three governance gates and four cumulative artifacts. Teams leave with documented method fluency and the capability to apply that method to a real system on a case of their choosing.',
    audience: 'Executives, operations leaders, transformation teams, and business teams in finance, HR, marketing operations, customer service, procurement, and support functions.',
    level: 'Foundation',
    duration: '22h 55m',
    framing: '12 modules · 4 phases · 3 gates · 4 artifacts · 4 formats',
    modules: ['m01', 'm02', 'm03', 'm04', 'm05', 'm06', 'm07', 'm08', 'm09', 'm10', 'm11', 'm12'],
    primaryMedia: {
      type: 'slides',
      url: '',
      title: 'AI Transformation Foundations course slides',
      format: 'pdf',
    },
    moduleMedia: {
      m01: { type: 'slides', url: '', title: 'M01 · LLM Fundamentals slides', format: 'pdf' },
      m02: { type: 'slides', url: '', title: 'M02 · Data Readiness & Preparation slides', format: 'pdf' },
      m03: { type: 'slides', url: '', title: 'M03 · Prompt-Driven Automation slides', format: 'pdf' },
      m04: { type: 'slides', url: '', title: 'M04 · AI Assistants & RAG slides', format: 'pdf' },
      m05: { type: 'slides', url: '', title: 'M05 · Prototyping with No-Code slides', format: 'pdf' },
      m06: { type: 'slides', url: '', title: 'M06 · AI Agents & Pilot slides', format: 'pdf' },
      m07: { type: 'slides', url: '', title: 'M07 · Tools & Platforms slides', format: 'pdf' },
      m08: { type: 'slides', url: '', title: 'M08 · Integration & Deployment Planning slides', format: 'pdf' },
      m09: { type: 'slides', url: '', title: 'M09 · AI Portfolio Scoring & Use Case Prioritisation slides', format: 'pdf' },
      m10: { type: 'slides', url: '', title: 'M10 · Documentation & Adoption slides', format: 'pdf' },
      m11: { type: 'slides', url: '', title: 'M11 · Monitoring & Quality slides', format: 'pdf' },
      m12: { type: 'slides', url: '', title: 'M12 · AI Strategy & Roadmap slides', format: 'pdf' },
    },
    methodology:
      'A universal AI systems method taught through transferable module assignments. The module demo stays simple; certification proves transfer by applying the full method to a participant-chosen capstone case.',
    artifacts: [
      'The Foundation — readiness self-assessment, data map, prompt library.',
      'The System — assistant, prototype, agent with pilot metrics.',
      'The Operating Plan — tool ADR, integration plan, scored portfolio.',
      'The Handoff Pack — system card, playbook, monitoring plan, strategic roadmap.',
    ],
    gates: [
      'Gate 1 — informal readiness check: is it safe to build?',
      'Gate 2 — informal readiness check: is it safe to deploy?',
      'Gate 3 — formal investment decision: which use cases earn the next investment cycle?',
    ],
    formats: [
      { label: 'Executive Sprint', duration: '1 day', coverage: 'Selected modules for orientation and conviction.' },
      { label: 'Team Workshop', duration: '2 days', coverage: 'Hands-on build plus governance overview.' },
      { label: 'Intensive Bootcamp', duration: '5 days', coverage: 'Complete program with all assignments.' },
      { label: 'Cohort Program', duration: '4–12 weeks', coverage: 'Full program with capstone extension.' },
    ],
    certification: {
      tier1: 'AI Builder Foundations',
      tier2: 'Certified AI Systems Builder',
      assessment: 'Artifact-based assessment. No exams. Tier 02 requires the separate mentored capstone track after Tier 01.',
    },
    capstoneCases: [
      {
        id: 'invoice-ocr',
        function: 'Finance',
        title: 'Invoice OCR for Accounts Payable',
        workflow: 'Capture supplier invoices, extract structured fields, map to accounting plan, route for HITL approval.',
        agent: 'Multi-step n8n agent with duplicate detection, vendor matching, audit logging.',
        why: 'Highest-volume governance use case. Tests every layer.',
      },
      {
        id: 'quote-generation',
        function: 'Sales',
        title: 'Quote Generation',
        workflow: 'Pull customer context from CRM, match products from catalog, generate compliant proposals.',
        agent: 'RAG-grounded drafting agent with pricing rules and legal-clause library.',
        why: 'High commercial leverage. Direct revenue impact.',
      },
      {
        id: 'hr-ticket-triage',
        function: 'HR',
        title: 'HR Ticket Triage & Routing',
        workflow: 'Classify incoming HR requests, route by topic and urgency, draft initial responses for review.',
        agent: 'Classification agent with policy RAG and escalation rules.',
        why: 'Tests privacy governance under realistic constraints.',
      },
      {
        id: 'customer-email-classification',
        function: 'Customer Ops',
        title: 'Customer Email Classification',
        workflow: 'Categorize support inbox, prioritize by urgency and intent, draft contextual replies.',
        agent: 'Multi-intent classifier with response drafter and escalation predictor.',
        why: 'High data volume. Strong precision/recall feedback loop.',
      },
      {
        id: 'rfp-response-drafting',
        function: 'Sales',
        title: 'RFP Response Drafting',
        workflow: 'Extract requirements, match capability library, draft compliance responses, flag gaps.',
        agent: 'Requirements-extraction agent plus RAG drafter plus compliance checker.',
        why: 'High-value, low-frequency. Strong audit-trail demands.',
      },
      {
        id: 'supplier-contract-review',
        function: 'Finance · Legal',
        title: 'Supplier Contract Review',
        workflow: 'Extract terms, flag risk clauses, summarize for legal review, track redline cycles.',
        agent: 'Term-extraction agent with clause-library RAG and risk scorer.',
        why: 'Stress-tests precision under regulatory pressure.',
      },
    ],
  },
];

export function getModule(id: ModuleId): ModuleMeta | undefined {
  return MODULES.find(m => m.id === id);
}

export function getNextModule(id: ModuleId): ModuleMeta | undefined {
  const index = MODULES.findIndex((m) => m.id === id);
  return index >= 0 ? MODULES[index + 1] : undefined;
}

export function getPhase(num: 1 | 2 | 3 | 4) {
  return PHASES.find(p => p.num === num);
}

export function getCourse(courseId: string): AssessCourseMeta | undefined {
  return COURSES.find((course) => course.id === courseId || course.slug === courseId);
}

export function getCourseModules(courseId: string): ModuleMeta[] {
  const course = getCourse(courseId);
  if (!course) return [];
  return course.modules.map((moduleId) => getModule(moduleId)).filter((module): module is ModuleMeta => Boolean(module));
}

export function getModuleCourse(moduleId: ModuleId): AssessCourseMeta | undefined {
  return COURSES.find((course) => course.modules.includes(moduleId));
}

export function getModuleMedia(moduleId: ModuleId): CoursePrimaryMedia | undefined {
  return getModuleCourse(moduleId)?.moduleMedia[moduleId];
}

export function isValidModuleId(id: string): id is ModuleId {
  return MODULES.some((m) => m.id === id);
}
