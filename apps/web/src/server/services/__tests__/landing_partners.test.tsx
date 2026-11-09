import { describe, expect, it } from "vitest";
import React from "react";
import StartPage from "@/app/page";
import { PARTNER } from "@/lib/partners";

describe("Landing Page Partner Marquee Ticker", () => {
  it("includes neutral breeder partners in baseline registry", () => {
    expect(PARTNER.length).toBeGreaterThan(1);
    const feldmark = PARTNER.find((p) => p.name === "Feldmark Genetics");
    expect(feldmark).toBeDefined();
    expect(feldmark?.logo).toBe("/partner/leiste/feldmark.svg");
  });

  it("renders all breeder logos cleanly without visual distortion or blur filters", async () => {
    const pageElement = await StartPage();
    expect(React.isValidElement(pageElement)).toBe(true);

    type ReactElementWithProps = React.ReactElement<{
      children?: React.ReactNode;
      className?: string;
      title?: string;
      alt?: string;
      src?: string;
    }>;

    const partnerLis: ReactElementWithProps[] = [];

    function findPartnerLis(node: React.ReactNode) {
      if (!React.isValidElement(node)) return;
      const el = node as ReactElementWithProps;
      if (el.type === "li" && (el.props.className?.includes("flex h-10 shrink-0 items-center"))) {
        partnerLis.push(el);
      }
      if (el.props?.children) {
        React.Children.forEach(el.props.children, findPartnerLis);
      }
    }

    findPartnerLis(pageElement);

    // Marquee track maintains 2 copies of partner list for seamless infinite loop
    expect(partnerLis.length).toBe(PARTNER.length * 2);

    for (const li of partnerLis) {
      expect(li.props.className).not.toContain("blur-[7px]");
      expect(li.props.title).toBeDefined();
      expect(li.props.title).toContain("Züchter");

      const child = React.isValidElement(li.props.children)
        ? (li.props.children as ReactElementWithProps)
        : null;
      expect(child).not.toBeNull();
      expect(child?.props.alt).toBeDefined();
    }
  });
});
