# Pet Paradise - Shopify Theme

## Project overview

Pet Paradise (petparadise.co.il) is a pet food store on Shopify. We are building a custom theme from scratch based on a starter template, replicating the design of petfoodkitchen.co.uk (saved in `insperation/` folder).

## Liquid reference

See `AGENTS.md` for the complete Liquid reference (architecture, filters, tags, objects, schema patterns, examples). Do NOT duplicate that content here.

## Design reference

The inspiration website HTML, CSS, images, and fonts are in:
- `insperation/insperation - copy 100%/petfoodkitchen.co.uk/index.html` - full page HTML
- `insperation/insperation - copy 100%/petfoodkitchen.co.uk/wp-content/themes/bluestone/assets/main.css` - main stylesheet
- `insperation/insperation - copy 100%/fonts.googleapis.com/css2.css` - Poppins font definitions
- `insperation/insperation - copy 100%/petfoodkitchen.co.uk/wp-content/themes/bluestone/assets/328c2bae4ea0621eabd4.otf` - custom display font
- `insperation/screencapture-petfoodkitchen-co-uk-2026-02-18-14_11_49 (1).png` - full page screenshot

### Design tokens

- **Primary font**: Poppins (Google Fonts) - body text, navigation, buttons
- **Display font**: Custom OTF (328c2bae4ea0621eabd4.otf) - large headings, decorative text
- **Color palette**: Black (#000), White (#fff), dark backgrounds with light text
- **Animations**: Scroll-triggered slide-up, fade-in, slide-right (using IntersectionObserver)
- **Layout**: Full-width sections, BEM CSS naming, responsive mobile-first
- **Carousel**: Glide.js-style horizontal sliders

### Homepage sections (in order)

1. **Header** - Sticky nav with logo (roundel), menu links, hamburger for mobile
2. **Main title** - Full-width brand name display (large SVG logo)
3. **Hero** - Video/image background with overlay heading + subtitle
4. **Push cards** - 2-column cards with image (overlay text) + content area (heading, intro, CTA button)
5. **Discover carousel** - Dark background, dual headers (left title + right tag), horizontal card slider
6. **CTA / Values** - Full-width background image, split content (text left, image right with icon overlay)
7. **Push cards (2nd)** - Same pattern as #4, different content
8. **Brands grid** - Dark background, brand cards with images + outline buttons
9. **News carousel** - Article cards slider with date, title, excerpt
10. **Contact** - Split layout: contact info (left) + form (right)
11. **Footer** - Dark background, logo, address, links, social, large brand name

## Build rules

- All text must use `{{ 'key' | t }}` translation filters
- Update `locales/en.default.json` and `locales/en.default.schema.json` with every new key
- CSS/JS goes in `{% stylesheet %}` / `{% javascript %}` tags (not in assets/ unless critical)
- Every snippet/block needs `{% doc %}` header
- Every section/block needs `{% schema %}` with `presets` for theme editor
- Use CSS variables for single-property settings, CSS classes for multi-property settings
- BEM naming convention for CSS classes
- Mobile-first responsive design
- Sentence case for all user-facing text

## Store context

- **Store URL**: petparadise.co.il
- **Language**: English (primary), potentially Hebrew later
- **Products**: Pet food and treats
- **Brand tone**: Premium, trustworthy, natural ingredients
