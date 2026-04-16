# Prescription PDF (pack-in) — PouchCare branded spec

Purpose: A printable prescription PDF that is included in the shipped order to support Australian border processing and supplier handling. It should look like a legitimate clinic document with clear prescriber/patient/medication details, plus explicit personal importation references.

## Layout (A4)

### Header (branded)
- PouchCare logo (left)
- Title (right): **PRESCRIPTION — Personal Importation (Australia)**
- Clinic line (small): clinic address | phone | email (and ABN if available)

### Sections (in order)
1) **Prescriber details**
   - Prescriber name (e.g., Dr First Last)
   - **Prescriber/provider number** (required)
   - Practice/clinic address
   - Practice/clinic phone
   - Optional: AHPRA number (if we ever store it)

2) **Patient details**
   - Full name
   - Residential address
   - Date of birth

3) **Medication(s)** (supports 1+ line items)
   For each medication item:
   - Display name (brand/flavour) + active ingredient
   - Strength + formulation
   - Pack size (20 pouches per can)
   - Quantity (cans)
   - Directions (sig): short, clear, templated preferred

4) **Administrative**
   - Date issued
   - Prescriber signature image

5) **Medication allowance (Personal Importation Scheme)**
   - Allowance limit: 60 cans per prescription (3 months supply)
   - This order quantity
   - Total supplied to date (this prescription)
   - Remaining allowance
   - Allowance status: AVAILABLE | EXHAUSTED

6) **Ingredients & compliance (supplier / border information)** (approved copy)
   - **Active ingredient:** Nicotine (present as **nicotine bitartrate** salt)
   - **Other ingredients (excipients):** Microcrystalline cellulose (E460), glycerol (E422), sodium carbonates (E500), tartaric acid (E334), calcium chloride (E509), acesulfame potassium (E950)
   - **Compliance statement:**
     > “This product contains **no controlled substances other than nicotine**. Supplied for the named patient’s **personal therapeutic use** only and must not be supplied to any other person.”

7) **References** (TGA) + QR
   - Personal Importation Scheme:
     - https://www.tga.gov.au/products/unapproved-therapeutic-goods/access-pathways/personal-importation-scheme
   - Nicotine pouches (importation):
     - https://www.tga.gov.au/products/unapproved-therapeutic-goods/therapeutic-vaping-goods/vaping-hub/nicotine-pouches#importation
   - **QR code:** single QR pointing to a landing page we control (GitHub Pages). Callum will provide final URL later.

## QR code placeholder requirements
- Reserve a square area approx **30mm x 30mm** (or 120x120 px at 100 dpi) in the footer/right.
- Label under it: **“Scan: Import info (TGA)”**
- For now, render placeholder box with text: **“QR — URL TBC”**

## Branding inputs needed
- Logo asset (SVG preferred)
- Brand colours (hex)
- Preferred fonts (or system fonts)

## Notes / guardrails
- Avoid claims that nicotine is not regulated; use the approved compliance phrasing (“no controlled substances other than nicotine”).
- Ingredient list is currently a fixed block (provided by Callum). If it varies by SKU in future, move to product data source.
