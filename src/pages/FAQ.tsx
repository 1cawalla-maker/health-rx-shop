import { Link } from "react-router-dom";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ArrowRight, MessageCircle } from "lucide-react";

const faqCategories = [
  {
    title: "General Questions",
    faqs: [
      {
        question: "What is NicoPatch?",
        answer: "NicoPatch is an Australian telehealth platform that connects you with AHPRA-registered doctors for consultations regarding nicotine pouches. If clinically appropriate, doctors can issue prescriptions that allow you to legally access nicotine pouches under Australia's Personal Importation Scheme.",
      },
      {
        question: "Are your doctors registered in Australia?",
        answer: "Yes, all of our doctors are registered with AHPRA (Australian Health Practitioner Regulation Agency) and are fully qualified to practice medicine in Australia. They undergo regular training and follow strict clinical guidelines.",
      },
      {
        question: "Is this service legal in Australia?",
        answer: "Yes, NicoPatch operates fully within Australian law. Nicotine-containing products require a prescription in Australia, and our platform facilitates legal access through legitimate medical consultations. Products are imported under the TGA's Personal Importation Scheme.",
      },
    ],
  },
  {
    title: "Consultations",
    faqs: [
      {
        question: "How do consultations work?",
        answer: "After creating an account and completing your medical profile, you can book a phone consultation at a time that suits you. During the consultation, the doctor will review your health history, discuss your needs, and determine if a prescription is appropriate for you.",
      },
      {
        question: "How long does a consultation take?",
        answer: "Initial consultations typically take 15-30 minutes. Follow-up consultations are usually shorter, around 10-15 minutes. The doctor will take as much time as needed to properly assess your situation.",
      },
      {
        question: "What if I'm not approved for a prescription?",
        answer: "Not all consultations result in a prescription—this is at the doctor's clinical discretion based on your health profile. If you're not approved, the doctor will explain why and may suggest alternative options. You will still be charged for the consultation as it is a medical service.",
      },
    ],
  },
  {
    title: "Prescriptions",
    faqs: [
      {
        question: "What is included in my prescription?",
        answer: "Your prescription specifies which nicotine pouch products you can order, the allowed nicotine strength range, maximum quantities per order and per month, and the prescription validity period. You can only order products that match your prescription.",
      },
      {
        question: "How long is my prescription valid?",
        answer: "Prescription validity varies based on the doctor's assessment, typically ranging from 3 to 12 months. You'll receive a notification when your prescription is nearing expiry and can book a follow-up consultation for renewal.",
      },
      {
        question: "Can I get my prescription renewed?",
        answer: "Yes, you can book a follow-up consultation before your prescription expires. The doctor will review your progress and determine if renewal is appropriate. Follow-up consultations are available at a reduced rate.",
      },
    ],
  },
  {
    title: "Products & Ordering",
    faqs: [
      {
        question: "What products are available?",
        answer: "We offer a range of nicotine pouch products from reputable brands. The products available to you depend on your prescription—you'll only see products that match your prescribed strength range and quantity limits.",
      },
      {
        question: "How does ordering work?",
        answer: "Once you have an active prescription, the product shop becomes accessible. You can browse eligible products, add them to your cart within your prescription limits, and complete checkout. Orders are shipped directly to your address.",
      },
      {
        question: "How long does delivery take?",
        answer: "Delivery times vary depending on your location, typically ranging from 5-14 business days. As products are imported under the Personal Importation Scheme, they must clear customs which can occasionally cause delays.",
      },
      {
        question: "What payment methods do you accept?",
        answer: "We accept major credit cards (Visa, Mastercard, American Express), as well as PayPal and bank transfers. All payments are processed securely through our payment provider.",
      },
    ],
  },
  {
    title: "Privacy & Security",
    faqs: [
      {
        question: "Is my medical information secure?",
        answer: "Yes, we take privacy extremely seriously. All medical records are stored securely in compliance with Australian privacy laws. Our platform uses bank-level encryption and we never share your information with third parties without your consent.",
      },
      {
        question: "Is the packaging discreet?",
        answer: "Yes, all orders are shipped in plain, unmarked packaging with no indication of the contents. Your privacy is important to us.",
      },
    ],
  },
];

export default function FAQ() {
  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="gradient-section py-16 md:py-24">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground">
              Frequently Asked Questions
            </h1>
            <p className="text-lg text-muted-foreground">
              Find answers to common questions about our telehealth service, consultations, 
              prescriptions, and ordering process.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container">
          <div className="max-w-3xl mx-auto space-y-12">
            {faqCategories.map((category) => (
              <div key={category.title}>
                <h2 className="font-display text-2xl font-bold text-foreground mb-6">
                  {category.title}
                </h2>
                <Accordion type="single" collapsible className="space-y-4">
                  {category.faqs.map((faq, index) => (
                    <AccordionItem 
                      key={index} 
                      value={`${category.title}-${index}`}
                      className="bg-card rounded-lg border border-border px-6 shadow-sm"
                    >
                      <AccordionTrigger className="text-left font-medium text-foreground hover:text-primary hover:no-underline py-4">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground pb-4">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 md:py-24 gradient-section">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-card rounded-2xl border border-border p-8 md:p-10 shadow-lg">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary mx-auto mb-6">
                <MessageCircle className="h-7 w-7" />
              </div>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4">
                Still Have Questions?
              </h2>
              <p className="text-muted-foreground mb-6">
                Our support team is here to help. Reach out and we'll get back to you as soon as possible.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button variant="hero" size="lg" asChild>
                  <Link to="/contact">
                    Contact Support
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link to="/auth?mode=signup">
                    Start Consultation
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
