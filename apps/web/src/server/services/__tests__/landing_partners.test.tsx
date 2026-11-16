import { describe, expect, it } from "vitest";
import React from "react";
import StartPage from "@/app/page";
import { PARTNER } from "@/lib/partners";

describe("Landing Page Partner Strip", () => {
  it("keeps neutral breeder partners in baseline registry", () => {
    expect(PARTNER.length).toBeGreaterThan(1);
    const feldmark = PARTNER.find((p) => p.name === "Feldmark Genetics");
    expect(feldmark).toBeDefined();
    expect(feldmark?.logo).toBe("/partner/leiste/feldmark.svg");
  });

  it("does not render the partner strip on the landing page for now", async () => {
    const pageElement = await StartPage();
    expect(React.isValidElement(pageElement)).toBe(true);

    type ReactElementWithProps = React.ReactElement<{
      children?: React.ReactNode;
      className?: string;
      id?: string;
      "aria-labelledby"?: string;
      title?: string;
    }>;

    let partnerSectionFound = false;
    const partnerLis: ReactElementWithProps[] = [];

    function inspect(node: React.ReactNode) {
      if (!React.isValidElement(node)) return;
      const el = node as ReactElementWithProps;

      if (el.type === "section" && (el.props.id === "partner" || el.props["aria-labelledby"] === "partner")) {
        partnerSectionFound = true;
      }
      if (el.type === "h2" && el.props.id === "partner") {
        partnerSectionFound = true;
      }
      if (el.type === "li" && el.props.className?.includes("flex h-10 shrink-0 items-center")) {
        partnerLis.push(el);
      }

      if (el.props?.children) {
        React.Children.forEach(el.props.children, inspect);
      }
    }

    inspect(pageElement);

    expect(partnerSectionFound).toBe(false);
    expect(partnerLis.length).toBe(0);
  });
});
