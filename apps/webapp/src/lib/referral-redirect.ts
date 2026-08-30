const REFERRAL_CODE_PLACEHOLDER_PATTERN =
  /%3Cref_code%3E|<ref_code>|\{\{ref_code\}\}|\{ref_code\}/gi;

export function applyReferralCodePlaceholders(
  destinationUrl: string,
  refcode: string,
) {
  return destinationUrl.replace(REFERRAL_CODE_PLACEHOLDER_PATTERN, refcode);
}

export function buildReferralRedirectUrl({
  destinationUrl,
  refcode,
  requestUrl,
}: {
  destinationUrl: string;
  refcode: string;
  requestUrl: string | URL;
}) {
  const resolvedDestination = applyReferralCodePlaceholders(
    destinationUrl,
    refcode,
  );
  const targetUrl = new URL(resolvedDestination, requestUrl);

  targetUrl.searchParams.set("refcode", refcode);

  return targetUrl;
}
