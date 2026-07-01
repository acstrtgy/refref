import {
  applyReferralCodePlaceholders,
  buildReferralRedirectUrl,
} from "../referral-redirect";

describe("Referral redirect helpers", () => {
  it("replaces supported refcode placeholders", () => {
    expect(
      applyReferralCodePlaceholders(
        "https://i.refref.ai/<ref_code>",
        "rjsnnjj",
      ),
    ).toBe("https://i.refref.ai/rjsnnjj");

    expect(
      applyReferralCodePlaceholders(
        "https://example.com/{ref_code}",
        "rjsnnjj",
      ),
    ).toBe("https://example.com/rjsnnjj");

    expect(
      applyReferralCodePlaceholders(
        "https://example.com/share/{{ref_code}}",
        "rjsnnjj",
      ),
    ).toBe("https://example.com/share/rjsnnjj");
  });

  it("replaces already encoded angle bracket placeholders", () => {
    expect(
      applyReferralCodePlaceholders(
        "https://i.refref.ai/%3Cref_code%3E",
        "rjsnnjj",
      ),
    ).toBe("https://i.refref.ai/rjsnnjj");
  });

  it("preserves existing params and appends refcode", () => {
    const targetUrl = buildReferralRedirectUrl({
      destinationUrl: "https://example.com/welcome?campaign=refref",
      refcode: "rjsnnjj",
      requestUrl: "https://staging-refref.strtgy.design/r/rjsnnjj",
    });

    expect(targetUrl.toString()).toBe(
      "https://example.com/welcome?campaign=refref&refcode=rjsnnjj",
    );
  });

  it("supports relative redirect destinations", () => {
    const targetUrl = buildReferralRedirectUrl({
      destinationUrl: "/",
      refcode: "rjsnnjj",
      requestUrl: "https://staging-refref.strtgy.design/r/rjsnnjj",
    });

    expect(targetUrl.toString()).toBe(
      "https://staging-refref.strtgy.design/?refcode=rjsnnjj",
    );
  });
});
