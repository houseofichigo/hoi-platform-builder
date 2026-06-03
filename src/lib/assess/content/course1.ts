import {
  M01_COURSE_CONTENT,
  getM01DangerousTaskOptions,
} from "./m01";
import {
  M02_COURSE_CONTENT,
  getM02ContextualRuleOptions,
  getM02InternalSourceOptions,
} from "./m02";
import {
  M03_COURSE_CONTENT,
  getM03PromptScaffolds,
} from "./m03";
import {
  M04_OCR_CONTENT,
  getM04AssistantScaffold,
} from "@/lib/worked-examples/invoice-ocr/m04";
import {
  M05_OCR_CONTENT,
  getM05PrototypeBriefScaffold,
} from "@/lib/worked-examples/invoice-ocr/m05";
import {
  M06_OCR_CONTENT,
  getM06AgentScaffold,
} from "@/lib/worked-examples/invoice-ocr/m06";
import {
  M07_OCR_CONTENT,
  getM07ToolDecisionScaffold,
} from "@/lib/worked-examples/invoice-ocr/m07";
import {
  M08_OCR_CONTENT,
  getM08DeploymentPlanScaffold,
} from "@/lib/worked-examples/invoice-ocr/m08";
import {
  M09_OCR_CONTENT,
  getM09PortfolioScaffold,
} from "@/lib/worked-examples/invoice-ocr/m09";
import {
  M10_OCR_CONTENT,
  getM10DocumentationScaffold,
} from "@/lib/worked-examples/invoice-ocr/m10";
import {
  M11_OCR_CONTENT,
  getM11MonitoringPlanScaffold,
} from "@/lib/worked-examples/invoice-ocr/m11";
import {
  M12_OCR_CONTENT,
  getM12StrategyScaffold,
} from "@/lib/worked-examples/invoice-ocr/m12";

export type * from "./types";
export type {
  ScaffoldKey,
  SixElementScaffold,
} from "./m03";

// Temporary adapter for Course 1 while the module-by-module v6 assignment
// rewrite lands. Core UI imports from this boundary instead of the applied
// Invoice OCR files directly, so future content swaps stay localized here.
export { M01_COURSE_CONTENT, M02_COURSE_CONTENT, M03_COURSE_CONTENT };
export const M04_COURSE_CONTENT = M04_OCR_CONTENT;
export const M05_COURSE_CONTENT = M05_OCR_CONTENT;
export const M06_COURSE_CONTENT = M06_OCR_CONTENT;
export const M07_COURSE_CONTENT = M07_OCR_CONTENT;
export const M08_COURSE_CONTENT = M08_OCR_CONTENT;
export const M09_COURSE_CONTENT = M09_OCR_CONTENT;
export const M10_COURSE_CONTENT = M10_OCR_CONTENT;
export const M11_COURSE_CONTENT = M11_OCR_CONTENT;
export const M12_COURSE_CONTENT = M12_OCR_CONTENT;

export {
  getM01DangerousTaskOptions,
  getM02ContextualRuleOptions,
  getM02InternalSourceOptions,
  getM03PromptScaffolds,
  getM04AssistantScaffold,
  getM05PrototypeBriefScaffold,
  getM06AgentScaffold,
  getM07ToolDecisionScaffold,
  getM08DeploymentPlanScaffold,
  getM09PortfolioScaffold,
  getM10DocumentationScaffold,
  getM11MonitoringPlanScaffold,
  getM12StrategyScaffold,
};
