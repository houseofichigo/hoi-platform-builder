import * as XLSX from "xlsx";

/**
 * Build a 3-sheet org-chart import template:
 *  1. Departments – name, parent_name, description, headcount
 *  2. People      – first_name, last_name, email, position, department_name, manager_email, role
 *  3. Instructions
 */
export function buildOrgChartTemplateWorkbook(): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();

  const departments = [
    ["name", "parent_name", "description", "headcount"],
    ["Operations", "", "Day-to-day execution", 8],
    ["Finance", "", "Accounting, AP/AR, reporting", 4],
    ["Customer Success", "Operations", "Onboarding & support", 3],
  ];
  const depSheet = XLSX.utils.aoa_to_sheet(departments);
  depSheet["!cols"] = [{ wch: 24 }, { wch: 24 }, { wch: 40 }, { wch: 12 }];
  depSheet["!freeze"] = { xSplit: 0, ySplit: 1 };
  XLSX.utils.book_append_sheet(wb, depSheet, "Departments");

  const people = [
    ["first_name", "last_name", "email", "position", "department_name", "manager_email", "role"],
    ["Alex", "Smith", "alex@example.com", "Head of Operations", "Operations", "", "admin"],
    ["Jamie", "Lee", "jamie@example.com", "Operations Analyst", "Operations", "alex@example.com", "employee"],
    ["Sam", "Patel", "sam@example.com", "Controller", "Finance", "", "admin"],
  ];
  const ppSheet = XLSX.utils.aoa_to_sheet(people);
  ppSheet["!cols"] = [
    { wch: 14 }, { wch: 14 }, { wch: 28 }, { wch: 24 }, { wch: 22 }, { wch: 28 }, { wch: 12 },
  ];
  ppSheet["!freeze"] = { xSplit: 0, ySplit: 1 };
  XLSX.utils.book_append_sheet(wb, ppSheet, "People");

  const instructions = [
    ["Org chart import — instructions"],
    [""],
    ["This workbook seeds the org chart and stages invitations as DRAFTS."],
    ["No emails are sent until you click 'Send all invites' on the org chart canvas."],
    [""],
    ["Departments sheet"],
    ["• name           Required. Department name (unique within the company)."],
    ["• parent_name    Optional. Must match another row's name (any order)."],
    ["• description    Optional. Short purpose statement."],
    ["• headcount      Optional integer. Planned size, used for reconciliation."],
    [""],
    ["People sheet"],
    ["• first_name      Required."],
    ["• last_name       Required."],
    ["• email           Required. Becomes the invitation recipient."],
    ["• position        Optional. Job title shown on the org chart."],
    ["• department_name Optional. Must match a row in Departments (or an existing one)."],
    ["• manager_email   Optional. Must match another row's email or an existing member."],
    ["• role            One of: admin, reviewer, employee, viewer. Defaults to employee."],
    [""],
    ["Tips"],
    ["• Leave a cell blank to skip it. Empty rows are ignored."],
    ["• Re-importing the same email updates the existing draft invitation."],
    ["• Re-importing the same department name updates the existing department."],
  ];
  const insSheet = XLSX.utils.aoa_to_sheet(instructions);
  insSheet["!cols"] = [{ wch: 80 }];
  XLSX.utils.book_append_sheet(wb, insSheet, "Instructions");

  return wb;
}

export function downloadOrgChartTemplate(filename = "org-chart-template.xlsx") {
  const wb = buildOrgChartTemplateWorkbook();
  XLSX.writeFile(wb, filename);
}