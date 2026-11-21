import json,sys
from PIL import Image
for raw,sz,dst in json.load(open(sys.argv[1])):
    im=Image.open(raw).convert('RGBA').resize((sz,sz),Image.LANCZOS)
    im.save(dst,optimize=True)
