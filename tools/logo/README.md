# Duo logo ("Twin Flame Embrace", rainbow)

Regenerates every logo/icon file from code.

```
cd tools/logo
python3 build_twin.py              # current logo (twin.py): also writes logo-mark.svg (animated) + logo-mark-static.svg
# python3 build3.py v              # older: v = Aurora Flame vibrant (flame.py); a = Twin Flames, b = Covenant
# python3 build.py c               # older Two-in-orbit colour versions (orbit.py)
node render.js . ../..             # renders the PNGs into the repo root (needs Playwright)
python3 -c "from PIL import Image;ims=[Image.open(f'f{n}.png').convert('RGBA') for n in (16,32,48)];ims[2].save('../../favicon.ico',sizes=[(16,16),(32,32),(48,48)],append_images=ims[:2])"
cp favicon.svg logo-mark.svg logo-mark-static.svg ../..
```
