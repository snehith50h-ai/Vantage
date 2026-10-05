# Vantage Website - Placeholder Guide

This project contains the fully implemented Next.js frontend with the requested "dark-neon + light-sheet" AI-infrastructure design. 

Here is a list of the placeholders and areas you should update to match your specific branding and content:

## 1. Logos & Partners
- **Hero Section Partners:** Currently using placeholders like "Vercel", "OpenAI", etc. Update these in `src/components/Hero.tsx` around line 91. If you have SVG logos, replace the text blocks with your `<img>` or `<svg>` tags.
- **Industries / Case Studies Logos:** Currently using text placeholders like "ACME CORP" in `src/components/Industries.tsx`. Replace these with actual monochromatic logos.
- **Main Navbar Logo:** Currently using a generic icon and text in `src/components/Navbar.tsx`. Update the icon and text to your actual logo.

## 2. Copy & Content
- **Hero Copy:** Update the main headline and subtitle in `src/components/Hero.tsx`. Ensure you keep the `<span className="gradient-word">` tag for the highlight effect!
- **Features (Storytelling):** The 4 signature features in `src/components/Storytelling.tsx` are tailored to "Vantage". Update the titles, descriptions, and mock data (benchmarks, terminal text).
- **Security & Trust:** Update the items in `src/components/SecurityTrust.tsx` to reflect your actual security/compliance features.
- **Use Cases Tabs:** The tabs ("Agents", "Planning", "Pitching") and their sub-cards are defined in the `TAB_CONTENT` object in `src/components/UseCasesTabs.tsx`.
- **Features Index:** The massive list of features in `src/components/FeaturesIndex.tsx` uses a simple array.
- **Blog Posts:** Placeholder blog posts are in `src/components/Blog.tsx`. Update these or connect them to your CMS.
- **Footer Links & Socials:** Update the columns in `src/components/Footer.tsx`.

## 3. Styling & Tokens
All colors, spacing, and fonts are defined as CSS variables in `src/app/globals.css`.
To change the primary accent pink or the deep magenta, simply update:
```css
  --color-accent-pink: #FF5C93;
  --color-accent-magenta: #C02BD6;
  --color-link-blue: #1F3A8A;
```

## Running the project
Make sure you have installed the dependencies:
```bash
npm install
```
Then start the development server:
```bash
npm run dev
```
