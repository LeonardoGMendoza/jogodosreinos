from PIL import Image, ImageDraw, ImageFilter, ImageOps
import math

def create_gold_gradient(size):
    # Gradient image for gold metallic texture
    grad = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(grad)
    
    # Elegant 45-degree linear gold gradient
    for y in range(size):
        for x in range(size):
            t = (x + y) / (2 * size)
            # Golden highlight points
            if t < 0.3:
                r = int(210 + (255 - 210) * (t / 0.3))
                g = int(160 + (220 - 160) * (t / 0.3))
                b = int(40 + (110 - 40) * (t / 0.3))
            elif t < 0.6:
                r = int(255 - (255 - 240) * ((t - 0.3) / 0.3))
                g = int(220 - (220 - 180) * ((t - 0.3) / 0.3))
                b = int(110 - (110 - 50) * ((t - 0.3) / 0.3))
            else:
                r = int(240 - (240 - 190) * ((t - 0.6) / 0.4))
                g = int(180 - (180 - 130) * ((t - 0.6) / 0.4))
                b = int(50 - (50 - 20) * ((t - 0.6) / 0.4))
            gdraw.point((x, y), fill=(r, g, b, 255))
    return grad

def draw_golden_crown(size=1024):
    # High resolution canvas for super-sampling
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    
    # 1. Background: Pure matte dark background (#121113)
    bg = Image.new('RGBA', (size, size), (18, 17, 20, 255))
    bg_draw = ImageDraw.Draw(bg)
    
    # Subtle dark ambient radial lighting
    cx, cy = size / 2, size / 2
    max_r = size * 0.6
    for r in range(int(max_r), 0, -8):
        alpha = int(35 * (1 - r / max_r))
        bg_draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(30 + alpha, 26 + alpha, 22 + alpha, 255))
    
    # 2. Draw Crown Silhouette (Mask)
    crown_mask = Image.new('L', (size, size), 0)
    cdraw = ImageDraw.Draw(crown_mask)
    
    # Coordinates normalized for 1024x1024
    # Bottom Bar
    bar_left = 310
    bar_right = 714
    bar_top = 670
    bar_bottom = 725
    cdraw.rectangle([bar_left, bar_top, bar_right, bar_bottom], fill=255)
    
    # Line width for geometric crown arms
    line_w = 42
    
    # Key Control Points for Crown Peaks
    # Outer bottom corners
    bl = (250, 620)
    br = (774, 620)
    
    # Top Peaks
    top_left = (250, 250)
    top_center = (512, 230)
    top_right = (774, 250)
    
    # Valleys / Inner vertices
    v_left = (360, 480)
    v_right = (664, 480)
    v_center_left = (430, 360)
    v_center_right = (594, 360)
    
    # Draw geometric crown paths using polygons & thick lines
    # Outer wing left
    cdraw.line([bl, top_left], fill=255, width=line_w)
    cdraw.line([top_left, v_left], fill=255, width=line_w)
    cdraw.line([v_left, top_center], fill=255, width=line_w)
    cdraw.line([top_center, v_right], fill=255, width=line_w)
    cdraw.line([v_right, top_right], fill=255, width=line_w)
    cdraw.line([top_right, br], fill=255, width=line_w)
    cdraw.line([bl, br], fill=255, width=line_w)
    
    # Fill solid interior of the crown shape
    solid_crown = [bl, top_left, v_left, top_center, v_right, top_right, br]
    cdraw.polygon(solid_crown, fill=255)
    
    # Cutout inner hollow spaces (the sharp triangles/quads inside the crown)
    # Left inner triangle cutout
    cutout_left = [(290, 560), (280, 340), (370, 460)]
    cdraw.polygon(cutout_left, fill=0)
    
    # Right inner triangle cutout
    cutout_right = [(734, 560), (744, 340), (654, 460)]
    cdraw.polygon(cutout_right, fill=0)
    
    # Center inner cutout
    cutout_center = [(400, 470), (512, 310), (624, 470)]
    cdraw.polygon(cutout_center, fill=0)

    # Smooth the mask edges slightly
    crown_mask = crown_mask.filter(ImageFilter.GaussianBlur(radius=1.5))
    
    # 3. Create Gold Gradient Layer
    gold_grad = create_gold_gradient(size)
    
    # 4. Create Glow Shadow
    glow_mask = crown_mask.filter(ImageFilter.GaussianBlur(radius=20))
    glow_layer = Image.new('RGBA', (size, size), (255, 190, 50, 90))
    bg.paste(glow_layer, (0, 0), mask=glow_mask)
    
    # 5. Composite Gold Crown onto Background
    gold_crown = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    gold_crown.paste(gold_grad, (0, 0), mask=crown_mask)
    
    bg.paste(gold_crown, (0, 0), mask=crown_mask)
    
    return bg

def main():
    base_img = draw_golden_crown(1024)
    
    # Save required sizes for iOS and PWA
    sizes = {
        'apple-touch-icon.png': (180, 180),
        'apple-touch-icon-precomposed.png': (180, 180),
        'icon-192.png': (192, 192),
        'icon-512.png': (512, 512),
        'favicon.png': (64, 64)
    }
    
    for name, sz in sizes.items():
        resized = base_img.resize(sz, Image.LANCZOS)
        resized.save(name)
        print(f"Gerado com sucesso: {name} ({sz[0]}x{sz[1]})")
        
    favicon_img = base_img.resize((64, 64), Image.LANCZOS)
    favicon_img.save("favicon.ico", format="ICO")
    print("Gerado com sucesso: favicon.ico")

if __name__ == "__main__":
    main()
