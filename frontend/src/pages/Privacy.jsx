import LegalPage from "@/components/LegalPage";
import { PRIVACY_POLICY } from "@/lib/legal";

export default function Privacy() {
  return (
    <LegalPage
      kind="privacy"
      title="Privacy Policy"
      summary="How Reachvel collects, uses, and safeguards your personal information across our website, products, and engagements."
      doc={PRIVACY_POLICY}
      peerLink={{ to: "terms", label: "Terms of Use" }}
    />
  );
}
