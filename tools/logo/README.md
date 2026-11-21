# Duo logo ("Twin Flames")

Regenerates every logo/icon file from code.

```
cd tools/logo
python3 build3.py a                # current logo: a = Twin Flames (flame.py); b = Covenant, c = Aurora Flame
# python3 build.py c               # older Two-in-orbit colour versions (orbit.py)
node render.js . ../..             # renders the PNGs into the repo root (needs Playwright)
python3 -c "from PIL import Image;ims=[Image.open(f'f{n}.png').convert('RGBA') for n in (16,32,48)];ims[2].save('../../favicon.ico',sizes=[(16,16),(32,32),(48,48)],append_images=ims[:2])"
cp favicon.svg logo-mark.svg ../..
```
