import hashlib


def md5(path: str) -> str:
    with open(path, "rb") as f:
        return hashlib.md5(f.read()).hexdigest()


if __name__ == "__main__":
    a = md5("assets/images/icon.png")
    b = md5("assets/images/icon-foreground.png")
    print(a)
    print(b)
    print("same" if a == b else "different")
