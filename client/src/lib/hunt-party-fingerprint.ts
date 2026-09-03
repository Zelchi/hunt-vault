import type { ParsedHuntParty } from "@/type/hunt-party";

const normalizeIdentityPart = (value: string) => {
	return value.trim().replace(/\s+/g, " ").toLowerCase();
};

const canonicalizePartyHuntIdentity = (sessionData: string, memberNames: string[]) => {
	const normalizedSession = normalizeIdentityPart(sessionData);
	const normalizedMembers = Array.from(
		new Set(
			memberNames.map(normalizeIdentityPart).filter((member) => {
				return member.length > 0;
			}),
		),
	).sort();

	if (!normalizedSession || normalizedMembers.length === 0) {
		throw new Error("Party hunt sem Session data ou membros válidos.");
	}

	return `session:${normalizedSession}\nmembers:${normalizedMembers.join("|")}`;
};

const sha256 = async (value: string) => {
	const bytes = new TextEncoder().encode(value);
	const digest = await crypto.subtle.digest("SHA-256", bytes);
	return Array.from(new Uint8Array(digest), (byte) => {
		return byte.toString(16).padStart(2, "0");
	}).join("");
};

const getPartyHuntFingerprint = async (party: Pick<ParsedHuntParty, "sessionData" | "members">) => {
	const canonicalIdentity = canonicalizePartyHuntIdentity(
		party.sessionData,
		party.members.map((member) => {
			return member.name;
		}),
	);
	return sha256(canonicalIdentity);
};

export { canonicalizePartyHuntIdentity, getPartyHuntFingerprint, normalizeIdentityPart };
