#!/bin/bash
# Generate placeholder SVG images for all image references in the Moulin a Reves site.
# These are SVGs saved with .jpg extension -- browsers will still render them.
# Replace with real photographs before production.
#
# Usage: cd public/images && bash generate-placeholders.sh

STONE="#F0EAE0"
BLUE="#E8F0F8"
TEXT="#6B6B6B"

generate_svg() {
  local file="$1"
  local width="$2"
  local height="$3"
  local label="$4"
  local bg="$5"

  mkdir -p "$(dirname "$file")"

  # Calculate font size based on image width
  local font_size=$(( width / 20 ))
  if [ "$font_size" -gt 32 ]; then font_size=32; fi
  if [ "$font_size" -lt 14 ]; then font_size=14; fi

  cat > "$file" <<SVGEOF
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="${bg}"/>
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
        font-family="Georgia, serif" font-size="${font_size}" fill="${TEXT}">${label}</text>
</svg>
SVGEOF
}

echo "Generating placeholder images..."

# Root images (hero/wide)
generate_svg "hero-compound.jpg"      1920 800 "Hero - Compound"         "$STONE"
generate_svg "forest-path.jpg"        1920 600 "Forest Path"             "$BLUE"
generate_svg "catering-table.jpg"     600  400 "Catering Table"          "$STONE"
generate_svg "yoga-lawn.jpg"          600  400 "Yoga Lawn"               "$BLUE"
generate_svg "barbizon-village.jpg"   600  400 "Barbizon Village"        "$STONE"
generate_svg "group-dinner.jpg"       600  400 "Group Dinner"            "$STONE"
generate_svg "evening-compound.jpg"   1920 600 "Evening Compound"        "$STONE"
generate_svg "about-hero.jpg"         1920 800 "About - Hero"            "$BLUE"
generate_svg "about-millstream.jpg"   1200 600 "About - Millstream"      "$BLUE"
generate_svg "about-owners.jpg"       600  600 "About - Owners"          "$STONE"
generate_svg "contact-hero.jpg"       1920 800 "Contact - Hero"          "$BLUE"
generate_svg "compound-aerial.jpg"    1920 800 "Compound - Aerial"       "$STONE"
generate_svg "compound-reunion.jpg"   600  400 "Compound - Reunion"      "$STONE"
generate_svg "compound-retreat.jpg"   600  400 "Compound - Retreat"      "$BLUE"
generate_svg "compound-yoga.jpg"      600  400 "Compound - Yoga"         "$BLUE"
generate_svg "compound-celebration.jpg" 600 400 "Compound - Celebration" "$STONE"
generate_svg "compound-grounds.jpg"   1200 600 "Compound - Grounds"      "$STONE"
generate_svg "catering-hero.jpg"      1920 800 "Catering - Hero"         "$STONE"
generate_svg "catering-breakfast.jpg" 600  400 "Catering - Breakfast"    "$STONE"
generate_svg "catering-dinner.jpg"    600  400 "Catering - Dinner"       "$STONE"
generate_svg "catering-occasion.jpg"  600  400 "Catering - Occasion"     "$STONE"
generate_svg "catering-chef.jpg"      600  400 "Catering - Chef"         "$STONE"
generate_svg "wellness-hero.jpg"      1920 800 "Wellness - Hero"         "$BLUE"
generate_svg "wellness-yoga.jpg"      600  400 "Wellness - Yoga"         "$BLUE"
generate_svg "wellness-massage.jpg"   600  400 "Wellness - Massage"      "$BLUE"
generate_svg "wellness-beauty.jpg"    600  400 "Wellness - Beauty"       "$BLUE"
generate_svg "gallery-hero.jpg"       1920 800 "Gallery - Hero"          "$STONE"
generate_svg "explore-hero.jpg"       1920 800 "Explore - Hero"          "$BLUE"

# Home images
generate_svg "homes/all-three.jpg"           1920 800 "All Three Houses"       "$STONE"
generate_svg "homes/le-moulin-hero.jpg"      1200 800 "Le Moulin - Hero"       "$STONE"
generate_svg "homes/le-moulin-bedroom-1.jpg" 600  400 "Le Moulin - Bedroom 1"  "$STONE"
generate_svg "homes/le-moulin-bedroom-2.jpg" 600  400 "Le Moulin - Bedroom 2"  "$STONE"
generate_svg "homes/le-moulin-bedroom-3.jpg" 600  400 "Le Moulin - Bedroom 3"  "$STONE"
generate_svg "homes/le-moulin-kitchen.jpg"   600  400 "Le Moulin - Kitchen"    "$STONE"
generate_svg "homes/le-moulin-living.jpg"    600  400 "Le Moulin - Living"     "$STONE"
generate_svg "homes/le-moulin-terrace.jpg"   600  400 "Le Moulin - Terrace"    "$BLUE"
generate_svg "homes/la-grange-hero.jpg"      1200 800 "La Grange - Hero"       "$STONE"
generate_svg "homes/la-grange-bedroom-1.jpg" 600  400 "La Grange - Bedroom 1"  "$STONE"
generate_svg "homes/la-grange-bedroom-2.jpg" 600  400 "La Grange - Bedroom 2"  "$STONE"
generate_svg "homes/la-grange-bedroom-3.jpg" 600  400 "La Grange - Bedroom 3"  "$STONE"
generate_svg "homes/la-grange-kitchen.jpg"   600  400 "La Grange - Kitchen"    "$STONE"
generate_svg "homes/la-grange-living.jpg"    600  400 "La Grange - Living"     "$STONE"
generate_svg "homes/la-grange-garden.jpg"    600  400 "La Grange - Garden"     "$BLUE"
generate_svg "homes/le-jardin-hero.jpg"      1200 800 "Le Jardin - Hero"       "$BLUE"
generate_svg "homes/le-jardin-bedroom-1.jpg" 600  400 "Le Jardin - Bedroom 1"  "$BLUE"
generate_svg "homes/le-jardin-bedroom-2.jpg" 600  400 "Le Jardin - Bedroom 2"  "$BLUE"
generate_svg "homes/le-jardin-bedroom-3.jpg" 600  400 "Le Jardin - Bedroom 3"  "$BLUE"
generate_svg "homes/le-jardin-kitchen.jpg"   600  400 "Le Jardin - Kitchen"    "$BLUE"
generate_svg "homes/le-jardin-living.jpg"    600  400 "Le Jardin - Living"     "$BLUE"
generate_svg "homes/le-jardin-terrace.jpg"   600  400 "Le Jardin - Terrace"    "$BLUE"

# Explore images
generate_svg "explore/barbizon.jpg"    600 400 "Barbizon"                "$STONE"
generate_svg "explore/chateau.jpg"     600 400 "Chateau"                 "$STONE"
generate_svg "explore/moret.jpg"       600 400 "Moret-sur-Loing"        "$BLUE"
generate_svg "explore/forest.jpg"      600 400 "Forest"                  "$BLUE"
generate_svg "explore/gorges.jpg"      600 400 "Gorges de Franchard"     "$STONE"
generate_svg "explore/cycling.jpg"     600 400 "Cycling"                 "$BLUE"
generate_svg "explore/market.jpg"      600 400 "Market"                  "$STONE"
generate_svg "explore/restaurant.jpg"  600 400 "Restaurant"              "$STONE"
generate_svg "explore/wine.jpg"        600 400 "Wine Tasting"            "$STONE"
generate_svg "explore/climbing.jpg"    600 400 "Climbing"                "$BLUE"
generate_svg "explore/horse.jpg"       600 400 "Horseback Riding"        "$BLUE"
generate_svg "explore/paris.jpg"       600 400 "Paris"                   "$STONE"

# Gallery images
generate_svg "gallery/moulin-exterior.jpg"  800 600 "Moulin Exterior"    "$STONE"
generate_svg "gallery/moulin-bedroom.jpg"   800 600 "Moulin Bedroom"     "$STONE"
generate_svg "gallery/moulin-kitchen.jpg"   800 600 "Moulin Kitchen"     "$STONE"
generate_svg "gallery/moulin-terrace.jpg"   800 600 "Moulin Terrace"     "$BLUE"
generate_svg "gallery/moulin-living.jpg"    800 600 "Moulin Living"      "$STONE"
generate_svg "gallery/moulin-detail.jpg"    800 600 "Moulin Detail"      "$STONE"
generate_svg "gallery/grange-exterior.jpg"  800 600 "Grange Exterior"    "$STONE"
generate_svg "gallery/grange-ceiling.jpg"   800 600 "Grange Ceiling"     "$STONE"
generate_svg "gallery/grange-kitchen.jpg"   800 600 "Grange Kitchen"     "$STONE"
generate_svg "gallery/grange-bedroom.jpg"   800 600 "Grange Bedroom"     "$STONE"
generate_svg "gallery/grange-garden.jpg"    800 600 "Grange Garden"      "$BLUE"
generate_svg "gallery/grange-detail.jpg"    800 600 "Grange Detail"      "$STONE"
generate_svg "gallery/jardin-exterior.jpg"  800 600 "Jardin Exterior"    "$BLUE"
generate_svg "gallery/jardin-terrace.jpg"   800 600 "Jardin Terrace"     "$BLUE"
generate_svg "gallery/jardin-bedroom.jpg"   800 600 "Jardin Bedroom"     "$BLUE"
generate_svg "gallery/jardin-living.jpg"    800 600 "Jardin Living"      "$BLUE"
generate_svg "gallery/jardin-kitchen.jpg"   800 600 "Jardin Kitchen"     "$BLUE"
generate_svg "gallery/jardin-wisteria.jpg"  800 600 "Jardin Wisteria"    "$BLUE"
generate_svg "gallery/grounds-aerial.jpg"   800 600 "Grounds Aerial"     "$STONE"
generate_svg "gallery/grounds-stream.jpg"   800 600 "Grounds Stream"     "$BLUE"
generate_svg "gallery/grounds-garden.jpg"   800 600 "Grounds Garden"     "$BLUE"
generate_svg "gallery/grounds-petanque.jpg" 800 600 "Grounds Petanque"   "$STONE"
generate_svg "gallery/grounds-table.jpg"    800 600 "Grounds Table"      "$STONE"
generate_svg "gallery/grounds-evening.jpg"  800 600 "Grounds Evening"    "$STONE"

echo "Done! Generated 86 placeholder images."
echo "Note: These are SVG files saved with .jpg extension."
echo "Modern browsers will render them correctly for development."
echo "Replace with real photographs before going to production."
