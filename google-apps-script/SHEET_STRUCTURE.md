  # Krishana Jewellers — Google Sheet Structure

Create **one** spreadsheet named `Krishana Jewellers CMS`.

Add these tabs (case-sensitive). Row 1 of each tab must contain the headers below.

## SETTINGS
key | value | type | enabled

Rows (example):
brandName | Krishana Jewellers | text | TRUE
instagram | krishana_jewellers.96 | text | TRUE
instagramUrl | https://instagram.com/... | url | TRUE
whatsapp | 919876543210 | phone | TRUE
phone | +91 98765 43210 | phone | TRUE
email | hello@… | email | TRUE
address | … | text | TRUE
city | … | text | TRUE
mapsUrl | https://maps.google.com/... | url | TRUE
hours | Mon–Sun · 10:30 AM – 8:30 PM | text | TRUE
announcement | Discover timeless jewellery | text | TRUE
heroTitle | Jewellery Made for Your Moments | text | TRUE
heroDescription | Discover elegant gold jewellery… | text | TRUE
heroImage | https://… | url | TRUE

## PRODUCTS
id | slug | name | category | collection | material | purity | weight | price | sku | featured | newArrival | bridal | gender | occasion | description | image | image2 | image3 | image4 | enabled | sortOrder

- `featured`, `newArrival`, `bridal`, `enabled` accept TRUE/FALSE.
- `price` blank = "Price on Request".

## CATEGORIES
id | name | slug | description | image | enabled | sortOrder

## GALLERY
id | image | caption | url | enabled | sortOrder

## TESTIMONIALS
id | name | rating | review | enabled | sortOrder

## ENQUIRIES
id | createdAt | name | phone | email | product | message | status

Populated automatically by the public contact form. Admin can only change `status`.

## APPOINTMENTS
id | createdAt | name | phone | email | date | time | service | message | status

## THEME
key | value

Rows:
primaryColor | #181614
secondaryColor | #E8D7B5
accentColor | #B88A2E
backgroundColor | #FAF7F0
surfaceColor | #F2ECE1
textColor | #2A2724
mutedColor | #7A736A
darkColor | #181614
buttonColor | #181614
buttonTextColor | #ffffff
announcementColor | #181614
announcementTextColor | #E8D7B5
fontHeading | 'Cormorant Garamond',serif
fontBody | 'Jost',sans-serif
borderRadius | 3px
shadowStyle | 0 12px 40px -18px rgba(24,22,20,.35)

## NAVIGATION
id | label | href | enabled | sortOrder

## FEATURES
key | value | type | enabled

Rows:
showInstagram | TRUE
showTestimonials | TRUE
showTrustSection | TRUE
showShowroom | TRUE
enableWishlist | TRUE

---

**No "Gold Rate" tab should exist.** This project deliberately omits live gold rates.
