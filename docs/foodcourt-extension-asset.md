# Foodcourt bottom extension

Tool: built-in imagegen, opaque background.
Reference: app/assets/foodcourt-clean.png (unchanged).
Output: app/assets/foodcourt-bottom-extension.png.
The generated extension overlaps the final 8% of the original square with an alpha gradient, then continues below it. This removes the hard cut while preserving the upper 92% exactly. Kiosk, table and animation coordinates remain relative to the original square.

Prompt:

Outpaint ONLY BELOW this square isometric foodcourt illustration. Produce a portrait 3:4 image. Original square image must occupy precisely the top 75% of output at full width, unchanged composition and scale, no cropping, no moving kiosks or table. Extend the remaining bottom 25% seamlessly downward: continue the existing light cream and lavender floor tiles in identical isometric perspective, low cream boundary walls and lush green plants at corners. Continue any cut off objects at bottom edge naturally. No new kiosks, tables, characters, text, UI, borders or blank bands. Match warm illustrated rendering and lighting. The original top square should remain exactly as reference; this is a downward canvas extension, not a redesigned image.
