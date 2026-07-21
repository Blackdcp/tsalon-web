import os
from PIL import Image, ImageDraw, ImageFont

# Canvas setup
width, height = 1920, 1080
canvas = Image.new('RGB', (width, height), '#0B1120') # Slate-950 color
draw = ImageDraw.Draw(canvas)

# Add a subtle grid for that tech aesthetic
grid_spacing = 60
for x in range(0, width, grid_spacing):
    draw.line([(x, 0), (x, height)], fill='#1E293B', width=1) # Slate-800
for y in range(0, height, grid_spacing):
    draw.line([(0, y), (width, y)], fill='#1E293B', width=1)

# Load logo
logo_path = r'c:\Users\user\Documents\T Salon\design-systems\01-protocol\prototype\public\images\logo-dark.png'
if os.path.exists(logo_path):
    logo = Image.open(logo_path).convert("RGBA")
    
    # Calculate target size (maybe 300px width)
    target_width = 400
    aspect_ratio = logo.height / logo.width
    target_height = int(target_width * aspect_ratio)
    logo = logo.resize((target_width, target_height), Image.Resampling.LANCZOS)
    
    # Calculate position (center horizontally, slightly above center vertically)
    logo_x = (width - target_width) // 2
    logo_y = (height - target_height) // 2 - 80
    
    canvas.paste(logo, (logo_x, logo_y), logo)

# Load fonts
font_path_zh = r"C:\Windows\Fonts\msyh.ttc"
font_title = ImageFont.truetype(font_path_zh, 80)
font_subtitle = ImageFont.truetype(font_path_zh, 40)

# Draw text
title = "内容与观点"
subtitle = "INDUSTRY OBSERVATION"

# Center the text
# getbbox returns (left, top, right, bottom)
title_bbox = draw.textbbox((0, 0), title, font=font_title)
title_w = title_bbox[2] - title_bbox[0]
title_x = (width - title_w) // 2
title_y = (height // 2) + 120

draw.text((title_x, title_y), title, font=font_title, fill='#F8FAFC') # Slate-50

sub_bbox = draw.textbbox((0, 0), subtitle, font=font_subtitle)
sub_w = sub_bbox[2] - sub_bbox[0]
sub_x = (width - sub_w) // 2
sub_y = title_y + 110

draw.text((sub_x, sub_y), subtitle, font=font_subtitle, fill='#94A3B8', spacing=10) # Slate-400

# Save image
out_path = r'c:\Users\user\Documents\T Salon\design-systems\01-protocol\prototype\public\images\default-cover.png'
canvas.save(out_path)
print("Generated default cover at:", out_path)
