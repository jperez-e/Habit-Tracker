from PIL import Image, ImageDraw, ImageFilter

SIZE = 1024


def build_foreground() -> Image.Image:
    img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Halo suave para que no se pierda en launchers oscuros.
    halo = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    hdraw = ImageDraw.Draw(halo)
    hdraw.ellipse((250, 250, 774, 774), fill=(108, 99, 255, 55))
    halo = halo.filter(ImageFilter.GaussianBlur(18))
    img.alpha_composite(halo)

    # Aro principal.
    draw.ellipse((280, 280, 744, 744), outline=(108, 99, 255, 255), width=54)

    # Segmentos de progreso.
    seg_colors = [
        (70, 198, 172, 255),
        (88, 204, 125, 255),
        (108, 99, 255, 255),
        (160, 75, 255, 255),
        (255, 149, 46, 255),
    ]
    seg_boxes = [
        (285, 285, 745, 745, 205, 248),
        (285, 285, 745, 745, 250, 292),
        (285, 285, 745, 745, 295, 342),
        (285, 285, 745, 745, 20, 72),
        (285, 285, 745, 745, 75, 118),
    ]
    for color, box in zip(seg_colors, seg_boxes):
        draw.arc(box[:4], box[4], box[5], fill=color, width=58)

    # Flecha de avance.
    draw.polygon([(690, 362), (818, 500), (650, 522)], fill=(255, 171, 52, 255))

    # Check central.
    draw.line((398, 542, 493, 640), fill=(255, 255, 255, 255), width=42, joint="curve")
    draw.line((493, 640, 645, 470), fill=(255, 255, 255, 255), width=42, joint="curve")

    # Hojas superiores.
    draw.ellipse((604, 214, 688, 302), fill=(85, 211, 118, 255))
    draw.ellipse((680, 204, 772, 300), fill=(70, 198, 172, 255))

    return img


if __name__ == "__main__":
    out = build_foreground()
    out.save("assets/images/icon-foreground.png", "PNG")
    print("Foreground transparente generado en assets/images/icon-foreground.png")
