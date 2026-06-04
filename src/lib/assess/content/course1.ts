import {
  M01_COURSE_CONTENT,
  getM01DangerousTaskOptions,
} from "./m01";
import {
  M02_DEFAULT_USE_CASE_ID,
  M02_COURSE_CONTENT,
  M02_USE_CASES,
  getM02UseCase,
  getM02ContextualRuleOptions,
  getM02InternalSourceOptions,
} from "./m02";
import {
  M03_COURSE_CONTENT,
  getM03PromptScaffolds,
} from "./m03";
import {
  getM04AssistantScaffold,
  M04_COURSE_CONTENT,
} from "./m04";
import {
  getM05PrototypeBriefScaffold,
  M05_COURSE_CONTENT,
} from "./m05";
import {
  getM06AgentScaffold,
  M06_COURSE_CONTENT,
} from "./m06";
import {
  getM07ToolDecisionScaffold,
  M07_COURSE_CONTENT,
} from "./m07";
import {
  getM08DeploymentPlanScaffold,
  M08_COURSE_CONTENT,
} from "./m08";
import {
  getM09PortfolioScaffold,
  M09_COURSE_CONTENT,
} from "./m09";
import {
  getM10DocumentationScaffold,
  M10_COURSE_CONTENT,
} from "./m10";
import {
  getM11MonitoringPlanScaffold,
  M11_COURSE_CONTENT,
} from "./m11";
import {
  getM12StrategyScaffold,
  M12_COURSE_CONTENT,
} from "./m12";

export type * from "./types";
export type {
  ScaffoldKey,
  SixElementScaffold,
} from "./m03";
export type { M02UseCase, M02UseCaseSource } from "./m02";

// Course 1 content boundary. Applied use-case content, including Invoice OCR,
// lives under the Use Case Tracks registry instead of the core course.
export { M01_COURSE_CONTENT, M02_DEFAULT_USE_CASE_ID, M02_COURSE_CONTENT, M02_USE_CASES, M03_COURSE_CONTENT };
export { M04_COURSE_CONTENT, M05_COURSE_CONTENT, M06_COURSE_CONTENT };
export { M07_COURSE_CONTENT, M08_COURSE_CONTENT, M09_COURSE_CONTENT };
export { M10_COURSE_CONTENT, M11_COURSE_CONTENT, M12_COURSE_CONTENT };

export {
  getM01DangerousTaskOptions,
  getM02UseCase,
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
