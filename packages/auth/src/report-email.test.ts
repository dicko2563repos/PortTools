import { describe, expect, it } from "vitest";
import { parseReportEmailRecipients, reportEmailRecipientList } from "./report-email";

describe("parseReportEmailRecipients", () => {
  it("accepts comma-separated addresses", () => {
    expect(parseReportEmailRecipients("a@b.com, c@d.com")).toBe("a@b.com, c@d.com");
  });

  it("rejects invalid addresses", () => {
    expect(parseReportEmailRecipients("not-an-email")).toBeNull();
  });
});

describe("reportEmailRecipientList", () => {
  it("splits stored recipients", () => {
    expect(reportEmailRecipientList("a@b.com, c@d.com")).toEqual(["a@b.com", "c@d.com"]);
  });
});
