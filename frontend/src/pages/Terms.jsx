import LegalPage from "@/components/LegalPage";
import { TERMS_OF_USE } from "@/lib/legal";

export default function Terms() {
  return (
    <LegalPage
      kind="terms"
      title="Terms of Use"
      summary="The legal terms governing your access to Reachvel's website, services, and software platforms."
      doc={TERMS_OF_USE}
      peerLink={{ to: "privacy", label: "Privacy Policy" }}
    />
  );
}
