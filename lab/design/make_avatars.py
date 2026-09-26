"""Generate 96px nav avatars from the team photos in the repo.

Reads  ../../src/_data/team.json and ../../src/media/<photo>
Writes ../media/avatars/<slug>.jpg and avatars.json (consumed by build.py)

Run from lab/design:  python3 make_avatars.py && python3 build.py
Needs macOS `sips` (no Python dependencies).
"""
import json, os, re, subprocess, unicodedata

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "..", ".."))
OUT_DIR = os.path.join(HERE, "..", "media", "avatars")
SIZE = 96          # output square (displayed at 32px → 3x)
ZOOM_W = 160       # resample width before cropping (≈1.7x zoom on the face)
CROP_Y = {         # per-person vertical crop offset (share of height); default 5%
    "weronika-grzebieluch": 0.30,
}

TR = str.maketrans({"ł": "l", "Ł": "L"})


def slug(s):
    """Match Eleventy's `slugify` for the names in team.json."""
    s = unicodedata.normalize("NFKD", s.translate(TR)).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")


def dim(path, key):
    out = subprocess.run(["sips", "-g", key, path], capture_output=True, text=True).stdout
    return int(re.search(key + r": (\d+)", out).group(1))


def main():
    team = json.load(open(os.path.join(REPO, "src", "_data", "team.json")))
    os.makedirs(OUT_DIR, exist_ok=True)
    result = {}
    for member in team:
        sl = slug(member["fullName"])
        src = os.path.join(REPO, "src", "media", member["photo"])
        dst = os.path.join(OUT_DIR, f"{sl}.jpg")
        subprocess.run(["sips", "--resampleWidth", str(ZOOM_W), src, "--out", dst], capture_output=True, check=True)
        h = dim(dst, "pixelHeight")
        y = max(0, min(round(h * CROP_Y.get(sl, 0.05)), h - SIZE))
        x = (ZOOM_W - SIZE) // 2
        subprocess.run(["sips", "-c", str(SIZE), str(SIZE), "--cropOffset", str(y), str(x),
                        "-s", "formatOptions", "72", dst, "--out", dst], capture_output=True, check=True)
        assert (dim(dst, "pixelWidth"), dim(dst, "pixelHeight")) == (SIZE, SIZE), sl
        result[sl] = {"name": member["fullName"], "photo": member["photo"],
                      "avatar": f"/media/avatars/{sl}.jpg", "cropY": CROP_Y.get(sl, 0.05)}
    json.dump(result, open(os.path.join(HERE, "avatars.json"), "w"), ensure_ascii=False, indent=1)
    print(f"{len(result)} avatars written to {os.path.relpath(OUT_DIR, HERE)}")


if __name__ == "__main__":
    main()
