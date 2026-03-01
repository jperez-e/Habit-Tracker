from PIL import Image, ImageDraw, ImageFilter


SIZE = 1024
CENTER = SIZE // 2


def create_background_icon() -> Image.Image:
    img = Image.new("RGBA", (SIZE, SIZE), "#12121E")
    draw = ImageDraw.Draw(img)

    # Tarjeta principal con bordes redondeados.
    margin = 92
    card_box = (margin, margin, SIZE - margin, SIZE - margin)
    draw.rounded_rectangle(card_box, radius=220, fill="#191A2D", outline="#2A2B45", width=8)

    # Sombra suave para dar profundidad.
    shadow = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    sdraw = ImageDraw.Draw(shadow)
    sdraw.ellipse((220, 220, 804, 804), fill=(0, 0, 0, 140))
    shadow = shadow.filter(ImageFilter.GaussianBlur(22))
    img.alpha_composite(shadow)

    # Núcleo del logo.
    draw.ellipse((240, 240, 784, 784), fill="#6C63FF")
    draw.ellipse((270, 270, 754, 754), fill="#736BFF")

    # Check central.
    draw.line((390, 540, 490, 640), fill="white", width=44, joint="curve")
    draw.line((490, 640, 660, 450), fill="white", width=44, joint="curve")

    # Brote (crecimiento de hábitos).
    draw.ellipse((610, 630, 770, 730), fill="#6BCB77")
    draw.ellipse((575, 690, 710, 790), fill="#6BCB77")
    draw.line((645, 675, 630, 760), fill="#4FA85E", width=12)

    return img


def create_foreground_logo() -> Image.Image:
    img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Elemento centrado para adaptive icon.
    draw.ellipse((220, 220, 804, 804), fill="#6C63FF")
    draw.ellipse((250, 250, 774, 774), fill="#736BFF")

    draw.line((380, 540, 490, 650), fill="white", width=44, joint="curve")
    draw.line((490, 650, 670, 440), fill="white", width=44, joint="curve")

    draw.ellipse((620, 640, 780, 740), fill="#6BCB77")
    draw.ellipse((580, 700, 720, 805), fill="#6BCB77")
    draw.line((650, 690, 635, 775), fill="#4FA85E", width=12)

    return img


if __name__ == "__main__":
    base = create_background_icon()
    fg = create_foreground_logo()

    base.save("assets/images/icon.png", "PNG")
    fg.save("assets/images/icon-foreground.png", "PNG")
    print("Logo generado: assets/images/icon.png y assets/images/icon-foreground.png")
