import { Link } from 'react-router-dom';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  HelpCircle, 
  ArrowRight, 
  ExternalLink,
  Stethoscope,
  Package,
  Shield,
  DollarSign,
  Truck,
  Scale
} from 'lucide-react';

const faqCategories = [
  {
    icon: Stethoscope,
    title: 'About the Service',
    faqs: [
      {
        question: 'How does the Health Rx Shop telehealth service work?',
        answer: `Our service provides a streamlined pathway for Australian adults to access nicotine pouches through proper medical supervision. Here's the process:

1. **Check Eligibility**: Complete a quick pre-screening questionnaire to see if nicotine pouch therapy might be suitable for you.

2. **Create an Account**: Sign up and complete your medical intake form with your health history and personal details.

3. **Book a Consultation**: Select a 1-hour consultation slot. You'll be assigned a qualified Australian doctor.

4. **Phone Consultation**: Your assigned doctor will call you during your slot to discuss your health, nicotine use history, and goals.

5. **Clinical Assessment**: The doctor makes a clinical decision on whether nicotine pouches are appropriate for you.

6. **Prescription (if approved)**: If suitable, you'll receive a digital prescription that unlocks access to our product shop.

7. **Order Products**: Purchase products within your prescription limits and have them delivered to your Australian address.

The entire process is conducted by AHPRA-registered Australian doctors following proper telehealth protocols.`
      },
      {
        question: 'Can doctors legally prescribe nicotine pouches in Australia?',
        answer: `Yes, doctors in Australia can prescribe nicotine pouches as they are classified as a Schedule 4 (Prescription Only) medicine by the Therapeutic Goods Administration (TGA).

Since October 2021, nicotine vaping products and other nicotine-containing products (excluding approved nicotine replacement therapies like patches and gums) require a valid prescription from an Australian registered medical practitioner.

Nicotine pouches fall under this category. When a doctor prescribes nicotine pouches, they are making a clinical judgment that the benefits of nicotine replacement therapy outweigh the risks for that specific patient, typically as part of a smoking cessation or harm reduction strategy.

Our platform connects patients with AHPRA-registered doctors who can assess suitability and issue prescriptions in accordance with Australian medical regulations.`
      },
      {
        question: 'What happens during the phone consultation?',
        answer: `During your 1-hour consultation slot, your assigned doctor will call you to conduct a comprehensive assessment:

**What the doctor will discuss:**
- Your smoking/vaping history and current nicotine use
- Your reasons for seeking nicotine pouches
- Your medical history and current medications
- Any contraindications or health concerns
- Your goals (quitting smoking, reducing harm, etc.)

**Important information:**
- The doctor will attempt to call up to 3 times during your slot
- If you don't answer after 3 attempts, the consultation may be cancelled
- Make sure you're available for the full hour with your phone charged and on loud
- Have your Medicare card and ID handy if requested

The doctor will then make a clinical decision about whether nicotine pouches are appropriate for you. If approved, you'll receive your prescription digitally.`
      },
      {
        question: 'What if my prescription request is declined?',
        answer: `If the doctor determines that nicotine pouches are not clinically appropriate for you, your prescription request will be declined. This can happen for various medical reasons, such as:

- Certain cardiovascular conditions
- Pregnancy or breastfeeding
- Specific medical contraindications
- No prior nicotine dependency (nicotine pouches are for existing nicotine users)

**What happens next:**
- You'll receive a notification explaining the doctor's decision
- The consultation fee is still applicable (the doctor's time and assessment have value regardless of outcome)
- You may be advised about alternative options or to consult with your regular GP
- You can request a second opinion by booking another consultation with a different doctor

We believe in transparent, honest medical practice. Not every patient will be suitable for nicotine pouch therapy, and our doctors prioritise your health and safety above all.`
      }
    ]
  },
  {
    icon: Scale,
    title: 'Legal & Regulatory',
    faqs: [
      {
        question: 'Are nicotine pouches legal in Australia?',
        answer: `Nicotine pouches occupy a specific legal position in Australia:

**The short answer:** Yes, they are legal to possess and use with a valid prescription.

**The regulatory framework:**
- Nicotine (other than in approved NRT products like patches/gums) is classified as a Schedule 4 Prescription Only medicine
- This includes nicotine pouches, which require a doctor's prescription
- With a prescription, you can legally import nicotine pouches for personal use under the TGA Personal Importation Scheme

**Without a prescription:**
- Importing or purchasing nicotine pouches without a prescription is illegal
- Border Force can seize non-prescription nicotine products
- Penalties can apply for illegal importation

**Our service ensures:**
- All prescriptions are issued by AHPRA-registered Australian doctors
- Products are imported legally under the Personal Importation Scheme
- Full compliance with TGA requirements

For more information, visit the [TGA website](https://www.tga.gov.au/nicotine).`
      },
      {
        question: 'What is the TGA Personal Importation Scheme?',
        answer: `The TGA Personal Importation Scheme allows Australian residents to legally import certain medications that aren't available or registered in Australia, provided they have a valid prescription.

**Key requirements:**
- You must have a prescription from an Australian-registered doctor
- The product is for your personal use only (not for supply to others)
- Maximum 3 months' supply can be imported at a time
- The product must not be prohibited under other laws

**How it applies to nicotine pouches:**
- Nicotine pouches aren't registered TGA products in Australia
- With a valid prescription, you can import them for personal use
- Our service facilitates this by connecting you with prescribing doctors
- Orders through our platform comply with personal importation requirements

**Limits:**
- You can only import quantities consistent with personal use
- Your prescription will specify maximum monthly quantities
- Orders exceeding prescription limits are not permitted

Learn more at: [TGA Personal Importation Scheme](https://www.tga.gov.au/personal-importation-scheme)`
      },
      {
        question: 'Will customs seize my order?',
        answer: `With a valid prescription, the risk of customs seizure is minimal. Here's what you need to know:

**Why orders might be inspected:**
- Australian Border Force randomly inspects international packages
- Packages containing nicotine products may be flagged for review

**What protects your order:**
- Your valid prescription from an AHPRA-registered doctor
- Order quantities within personal importation limits
- Proper documentation and labeling

**What we do to ensure smooth delivery:**
- All orders include prescription documentation
- Packaging clearly identifies the contents
- Quantities comply with personal importation limits
- We work with reputable shipping partners experienced in pharmaceutical imports

**If your order is held:**
- Border Force may contact you to verify your prescription
- We can provide supporting documentation if needed
- Most held orders are released once prescription is verified

**Success rate:**
The vast majority of orders with valid prescriptions pass through customs without issue. In rare cases of seizure, we'll work with you on resolution options.`
      }
    ]
  },
  {
    icon: Package,
    title: 'Products',
    faqs: [
      {
        question: 'What brands of nicotine pouches are available?',
        answer: `We offer a curated selection of premium nicotine pouch brands:

**ZYN** - The original and most popular nicotine pouch brand globally
- Wide range of flavors and strengths
- Consistent quality and experience

**VELO** - Premium pouches from BAT
- Modern formulations
- Popular mint and fruit flavors

**Nordic Spirit** - Swedish heritage
- Authentic Scandinavian quality
- Unique flavor profiles

**On!** - Compact and discreet
- Smaller pouch format
- Quick nicotine delivery

**Rogue** - American brand
- Bold flavors
- Various strength options

**Product selection is based on:**
- Your doctor's prescription (strength limits)
- Personal preference (flavor, format)
- Availability at time of order

All products are sourced from authorized suppliers and comply with quality standards.`
      },
      {
        question: 'What nicotine strengths are available?',
        answer: `Nicotine pouches come in various strengths to match different user needs:

**Common strength ranges:**
- **Low (2-4mg):** Best for light smokers or those stepping down
- **Medium (6mg):** Suitable for moderate smokers
- **High (8-12mg):** For heavy smokers or those with higher nicotine tolerance
- **Extra High (12mg+):** For very heavy smokers (requires specific clinical justification)

**Your prescription will specify:**
- Minimum and maximum strength you can order
- This is based on your smoking history and nicotine dependence
- You cannot order products above your prescribed maximum

**Strength recommendations:**
- Former heavy smokers (20+ cigarettes/day): Usually start at 6-9mg
- Moderate smokers (10-20/day): Usually 4-6mg
- Light smokers (<10/day): Usually 2-4mg
- Those stepping down: May reduce strength over time with doctor guidance

Your prescribing doctor will recommend an appropriate strength range based on your individual assessment.`
      },
      {
        question: 'How do I use nicotine pouches?',
        answer: `Nicotine pouches are simple and discreet to use:

**Basic usage:**
1. Take a pouch from the can
2. Place it between your upper lip and gum
3. You may feel a tingling sensation - this is normal
4. Leave in place for 15-60 minutes (varies by preference)
5. Dispose of the pouch responsibly (use the lid compartment)

**Tips for new users:**
- Start with lower strengths to gauge your tolerance
- Begin with shorter sessions (15-20 minutes)
- Stay hydrated
- Don't chew the pouch
- It's normal to experience some initial tingling

**What to expect:**
- Nicotine is absorbed through the gum lining
- Effects are felt within a few minutes
- Provides a similar nicotine satisfaction to smoking
- No smoke, vapour, or odour

**Responsible use:**
- Follow your prescription limits
- Don't use more pouches than recommended
- If you experience discomfort, remove the pouch
- Keep out of reach of children and pets`
      }
    ]
  },
  {
    icon: DollarSign,
    title: 'Pricing & Payment',
    faqs: [
      {
        question: 'How much does the consultation cost?',
        answer: `Our consultation fee is **$49 AUD**.

**What's included:**
- Pre-booking eligibility screening
- Full 1-hour consultation slot
- Clinical assessment by an AHPRA-registered doctor
- Medical record keeping
- Digital prescription (if approved)

**Important notes:**
- The fee is for the doctor's time and professional assessment
- It applies regardless of prescription outcome
- Payment is required at time of booking, before the consultation
- No hidden fees or subscription required

**Refund policy:**
- Cancellations 24+ hours before: Full refund
- Cancellations within 24 hours: No refund
- If doctor cannot reach you after 3 attempts: No refund
- Technical issues on our end: Full refund or reschedule

**We don't charge extra for:**
- Follow-up questions via secure messaging
- Prescription renewal assessments (new consultation required)
- Access to the product shop`
      },
      {
        question: 'How much do the products cost?',
        answer: `Product pricing varies by brand and pack size:

**Typical price ranges (per can):**
- Budget options: $8-12 AUD
- Standard brands: $12-18 AUD  
- Premium brands: $18-25 AUD

**Pack options:**
- Single cans
- 5-packs (typically 10-15% savings)
- 10-packs (best value, 15-20% savings)

**What affects pricing:**
- Brand (ZYN, VELO, etc.)
- Strength (higher strengths may vary)
- Pack size
- Current promotions

**Additional costs:**
- Shipping: $9.95 flat rate (free on orders over $100)
- No import duties (included in product price)
- No hidden customs fees

**Your prescription limits apply:**
- Maximum order quantity per order
- Maximum quantity per month
- Only products within your strength range

Browse our shop for current pricing once you have an active prescription.`
      },
      {
        question: 'What payment methods do you accept?',
        answer: `We accept a variety of secure payment methods:

**Credit & Debit Cards:**
- Visa
- Mastercard
- American Express

**Digital Wallets:**
- Apple Pay
- Google Pay

**Coming soon:**
- Afterpay/Zip (buy now, pay later)
- PayPal

**Payment security:**
- All transactions are encrypted
- We never store your full card details
- PCI DSS compliant payment processing

**For consultations:**
- Payment at time of booking
- Non-refundable within 24 hours of scheduled time

**For products:**
- Payment at checkout
- Confirmation email with receipt
- Order processed same business day (before 2pm AEST)`
      }
    ]
  },
  {
    icon: Truck,
    title: 'Shipping & Delivery',
    faqs: [
      {
        question: 'How long does delivery take?',
        answer: `Delivery times depend on your location and stock availability:

**Standard shipping:**
- Metro areas (Sydney, Melbourne, Brisbane, Perth, Adelaide): 5-10 business days
- Regional areas: 7-14 business days
- Remote areas: 10-21 business days

**Why the timeframe?**
Products are shipped from international suppliers under the Personal Importation Scheme, so delivery includes:
- Order processing (1-2 days)
- International shipping (5-10 days)
- Customs clearance (1-3 days)
- Domestic delivery (1-3 days)

**Tracking:**
- Tracking number provided once shipped
- Track via Australia Post or courier website
- Email updates at key milestones

**Delays can occur due to:**
- Customs inspection (usually resolved within 3 days)
- Public holidays
- Remote location
- Weather events

We recommend ordering before you run out, allowing 2-3 weeks for delivery.`
      },
      {
        question: 'Do you ship to all Australian addresses?',
        answer: `Yes, we ship to all Australian addresses:

**We deliver to:**
- All Australian states and territories
- Metro and regional areas
- PO Boxes
- Parcel lockers

**Shipping costs:**
- Standard shipping: $9.95 AUD
- Free shipping on orders over $100 AUD

**Not available:**
- International shipping (Australia only)
- Business addresses with restricted receiving hours may experience delays

**For best results:**
- Use a residential address where someone can receive packages
- Consider a parcel locker for convenience
- Provide accurate contact details for courier updates

**Note:** We only ship to Australian addresses as our service operates under Australian medical regulations and the TGA Personal Importation Scheme.`
      }
    ]
  }
];

export default function FAQPage() {
  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden gradient-section">
        <div className="container py-16 md:py-24">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <HelpCircle className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground">
              Frequently Asked Questions
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to know about our telehealth service, nicotine pouches in Australia, 
              and how to access them legally.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Categories */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container max-w-4xl">
          {faqCategories.map((category, categoryIndex) => (
            <div key={category.title} className={categoryIndex > 0 ? 'mt-12' : ''}>
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <category.icon className="h-5 w-5" />
                </div>
                <h2 className="font-display text-2xl font-bold text-foreground">
                  {category.title}
                </h2>
              </div>
              
              <Accordion type="single" collapsible className="space-y-4">
                {category.faqs.map((faq, index) => (
                  <AccordionItem 
                    key={index} 
                    value={`${category.title}-${index}`}
                    className="border rounded-lg px-6"
                  >
                    <AccordionTrigger className="text-left hover:no-underline py-4">
                      <span className="font-medium">{faq.question}</span>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4">
                      <div className="prose prose-sm max-w-none text-muted-foreground">
                        {faq.answer.split('\n\n').map((paragraph, pIndex) => (
                          <p key={pIndex} className="mb-4 last:mb-0 whitespace-pre-line">
                            {paragraph}
                          </p>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
        </div>
      </section>

      {/* External Resources */}
      <section className="py-16 md:py-24 gradient-section">
        <div className="container max-w-4xl">
          <h2 className="font-display text-2xl font-bold text-foreground text-center mb-8">
            Official Resources
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <h3 className="font-medium mb-2">TGA - Nicotine Information</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Official information about nicotine regulation in Australia.
                </p>
                <Button variant="outline" size="sm" asChild>
                  <a href="https://www.tga.gov.au/nicotine" target="_blank" rel="noopener noreferrer">
                    Visit TGA
                    <ExternalLink className="ml-2 h-3 w-3" />
                  </a>
                </Button>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <h3 className="font-medium mb-2">TGA - Personal Importation Scheme</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Learn about importing prescription medicines for personal use.
                </p>
                <Button variant="outline" size="sm" asChild>
                  <a href="https://www.tga.gov.au/personal-importation-scheme" target="_blank" rel="noopener noreferrer">
                    Learn More
                    <ExternalLink className="ml-2 h-3 w-3" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-primary">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="font-display text-3xl font-bold text-primary-foreground">
              Still Have Questions?
            </h2>
            <p className="text-lg text-primary-foreground/80">
              Our team is here to help. Get in touch or start your consultation today.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button 
                size="lg" 
                className="bg-background text-primary hover:bg-background/90"
                asChild
              >
                <Link to="/contact">
                  Contact Us
                </Link>
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
                asChild
              >
                <Link to="/eligibility">
                  Check Eligibility
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
