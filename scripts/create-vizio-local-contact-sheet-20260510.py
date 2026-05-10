
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
out=Path('screenshots/vizio-site-local-bridge-20260510')
img=Image.open(out/'01-local-vizio-setup.png').convert('RGB')
w,h=img.size
label_h=64
sheet=Image.new('RGB',(w,h+label_h),'white')
sheet.paste(img,(0,0))
d=ImageDraw.Draw(sheet)
d.rectangle([0,h,w,h+label_h], fill=(17,24,39))
d.text((18,h+18),'Local VIZIO setup: localhost bridge path', fill=(255,255,255))
sheet.save(out/'contact-sheet.png')
print(out/'contact-sheet.png', sheet.size)
