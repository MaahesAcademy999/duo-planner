# Duo logo ("Twin Flame Embrace", rainbow)

Regenerates every logo/icon file from code.

```
cd tools/logo
python3 build_twin.py              # current logo (twin.py): also writes logo-mark.svg (animated) + logo-mark-static.svg
# python3 build3.py v              # older: v = Aurora Flame vibrant (flame.py); a = Twin Flames, b = Covenant
# python3 build.py c               # older Two-in-orbit colour versions (orbit.py)
node render_hq.js . ../.. && python3 down.py plan.json   # supersampled PNGs (4x, Lanczos) into the repo root, incl. 1024px masters
python3 -c "from PIL import Image;ims=[Image.open(f'f{n}.png').convert('RGBA') for n in (16,32,48,64)];ims[3].save('../../favicon.ico',sizes=[(16,16),(32,32),(48,48),(64,64)],append_images=ims[:3])"
cp favicon.svg logo-mark.svg logo-mark-static.svg ../..
```
