import { ExternalLink, FileCheck2, ShieldCheck } from "lucide-react";

import { PublicLayout } from "@/components/layout/PublicLayout";
import Seo, { SITE_ORIGIN } from "@/components/seo/Seo";
import { breadcrumbSchema, medicalWebPageSchema } from "@/components/seo/schema";

const tgaPersonalImportationUrl =
  "https://www.tga.gov.au/products/unapproved-therapeutic-goods/access-pathways/personal-importation-scheme";

const tgaNicotinePouchesUrl =
  "https://www.tga.gov.au/products/unapproved-therapeutic-goods/therapeutic-vaping-goods/vaping-hub/nicotine-pouches#importation";

const ingredientRows = [
  ["Nicotine bitartrate salt", "Prescription-only active ingredient", "Covered by the patient-specific Australian prescription."],
  ["Microcrystalline cellulose (E460)", "Excipient / food additive", "Common permitted excipient; not a controlled substance."],
  ["Glycerol (E422)", "Excipient / food additive", "Common permitted excipient; not a controlled substance."],
  ["Sodium carbonates (E500)", "Excipient / food additive", "Common permitted excipient; not a controlled substance."],
  ["Tartaric acid (E334)", "Excipient / food additive", "Common permitted excipient; not a controlled substance."],
  ["Calcium chloride (E509)", "Excipient / food additive", "Common permitted excipient; not a controlled substance."],
  ["Acesulfame potassium (E950)", "Excipient / food additive", "Common permitted sweetener; not a controlled substance."],
];

export default function ImportationBasis() {
  return (
    <PublicLayout>
      <Seo
        title="Prescription Importation Basis"
        description="PouchCare border and customs reference page for prescription-supported personal importation of nicotine pouches into Australia."
        canonicalPath="/importation-basis"
        ogType="website"
        jsonLd={[
          medicalWebPageSchema({
            url: `${SITE_ORIGIN}/importation-basis`,
            name: "Prescription Importation Basis",
            description:
              "Border and customs reference page for prescription-supported personal importation of nicotine pouches into Australia.",
            dateModified: "2026-05-15",
          }),
          breadcrumbSchema({
            items: [
              { name: "Home", url: `${SITE_ORIGIN}/` },
              { name: "Prescription Importation Basis", url: `${SITE_ORIGIN}/importation-basis` },
            ],
          }),
        ]}
      />

      <section className="py-14 md:py-20">
        <div className="container">
          <div className="mx-auto max-w-4xl">
            <div className="mb-8 rounded-2xl border border-primary/25 bg-primary/5 p-6 md:p-8">
              <div className="mb-4 flex items-center gap-3 text-primary">
                <ShieldCheck className="h-8 w-8" />
                <p className="text-sm font-semibold uppercase tracking-wide">Border Security / Customs Reference</p>
              </div>
              <h1 className="font-display text-3xl font-bold text-foreground md:text-5xl">
                Prescription-supported personal importation basis
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">
                This page supports PouchCare supplier print documents for direct-to-patient parcels containing prescribed nicotine pouches for an Australian patient/importer.
              </p>
            </div>

            <div className="space-y-8 text-muted-foreground">
              <section className="rounded-xl border bg-card p-6">
                <h2 className="mb-3 flex items-center gap-2 font-display text-2xl font-semibold text-foreground">
                  <FileCheck2 className="h-6 w-6 text-primary" />
                  Legal basis summary
                </h2>
                <ul className="list-disc space-y-2 pl-6">
                  <li>
                    The parcel is intended for the named Australian patient/importer and is supported by a patient-specific prescription.
                  </li>
                  <li>
                    The importation pathway is the TGA Personal Importation Scheme for personal therapeutic use, not commercial distribution.
                  </li>
                  <li>
                    The supplier print document identifies the patient/importer, prescriber, prescribed nicotine product, declared quantity, and delivery address.
                  </li>
                  <li>
                    The product is not for resale or supply to another person.
                  </li>
                </ul>
              </section>

              <section className="rounded-xl border bg-card p-6">
                <h2 className="mb-3 font-display text-2xl font-semibold text-foreground">Authority references</h2>
                <div className="space-y-4">
                  <a
                    href={tgaPersonalImportationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 rounded-lg border p-4 text-foreground hover:bg-muted/40"
                  >
                    <ExternalLink className="mt-1 h-5 w-5 shrink-0 text-primary" />
                    <span>
                      <span className="block font-semibold">TGA Personal Importation Scheme</span>
                      <span className="break-all text-sm text-muted-foreground">{tgaPersonalImportationUrl}</span>
                    </span>
                  </a>
                  <a
                    href={tgaNicotinePouchesUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 rounded-lg border p-4 text-foreground hover:bg-muted/40"
                  >
                    <ExternalLink className="mt-1 h-5 w-5 shrink-0 text-primary" />
                    <span>
                      <span className="block font-semibold">TGA nicotine pouches importation guidance</span>
                      <span className="break-all text-sm text-muted-foreground">{tgaNicotinePouchesUrl}</span>
                    </span>
                  </a>
                </div>
              </section>

              <section className="rounded-xl border bg-card p-6">
                <h2 className="mb-3 font-display text-2xl font-semibold text-foreground">Ingredient declaration</h2>
                <p className="mb-4">
                  Nicotine is present as nicotine bitartrate salt and is the prescribed active ingredient. The other listed ingredients are common excipients or food additives and are not declared as controlled substances.
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[680px] border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b text-foreground">
                        <th className="py-3 pr-4 font-semibold">Ingredient</th>
                        <th className="py-3 pr-4 font-semibold">Role</th>
                        <th className="py-3 font-semibold">Importation note</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ingredientRows.map(([ingredient, role, note]) => (
                        <tr key={ingredient} className="border-b last:border-b-0">
                          <td className="py-3 pr-4 text-foreground">{ingredient}</td>
                          <td className="py-3 pr-4">{role}</td>
                          <td className="py-3">{note}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-6">
                <h2 className="mb-3 font-display text-2xl font-semibold text-foreground">Document verification note</h2>
                <p>
                  This web page is a general reference page. The controlling parcel document is the patient-specific supplier print document included with the shipment, which contains the named patient/importer, prescriber details, prescription-supported medicine details, quantity, and delivery address.
                </p>
              </section>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
