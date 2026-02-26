import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Info, ExternalLink, Pill, Shield } from 'lucide-react';

export default function DoctorInfo() {
  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="font-display text-3xl font-bold">Information</h1>
        <p className="text-muted-foreground mt-1">Reference material for prescribers</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Pill className="h-5 w-5 text-primary" />Product Information Overview</CardTitle>
          <CardDescription>Nicotine pouches — general product context</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">Schedule 4 (Australia)</Badge>
            <Badge variant="outline">Personal Importation Scheme</Badge>
            <Badge variant="outline">Phone consultation</Badge>
          </div>

          <ul className="list-disc list-inside text-muted-foreground space-y-1">
            <li>Nicotine pouches are tobacco-free oral products containing nicotine.</li>
            <li>Available in strengths ranging from 3mg to 12mg per pouch.</li>
            <li>Placed between lip and gum; used as a tobacco alternative.</li>
            <li>Classified as Schedule 4 in Australia — require a valid prescription.</li>
            <li>Supply is permissible under the TGA Personal Importation Scheme for individual patient use.</li>
          </ul>

          <p className="text-muted-foreground">
            This overview is for practitioner reference only. It does not constitute clinical advice or a recommendation to prescribe.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-primary" />Regulatory Context</CardTitle>
          <CardDescription>TGA and prescribing framework</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <ul className="list-disc list-inside text-muted-foreground space-y-1">
            <li>From 1 October 2021, nicotine vaping products and nicotine pouches are classified as Schedule 4 (Prescription Only) in Australia.</li>
            <li>A valid prescription from an Australian-registered medical practitioner is required.</li>
            <li>The TGA Personal Importation Scheme allows individuals to import up to a 3-month supply of a prescription medicine for personal use.</li>
            <li>Prescribers should assess suitability on a case-by-case basis, considering the patient's history and clinical context.</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Info className="h-5 w-5 text-primary" />Useful Links</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <a href="https://www.tga.gov.au/nicotine-vaping-products" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 text-primary hover:underline">
            <ExternalLink className="h-4 w-4" />TGA — Nicotine vaping products
          </a>
          <a href="https://www.tga.gov.au/personal-importation-scheme" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 text-primary hover:underline">
            <ExternalLink className="h-4 w-4" />TGA — Personal Importation Scheme
          </a>
          <a href="https://www.ahpra.gov.au/" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 text-primary hover:underline">
            <ExternalLink className="h-4 w-4" />AHPRA — Medical practitioner registration
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
