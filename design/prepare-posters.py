from pathlib import Path
from PIL import Image
import json
root=Path(__file__).resolve().parent.parent
asset=root/'assets/img/scene'
sizes={}
for path in sorted(asset.glob('*.png')):
    with Image.open(path) as im:
        output=path.with_suffix('.webp')
        im.convert('RGB').save(output,'WEBP',quality=88,method=6)
        sizes[output.name]={'width':im.width,'height':im.height,'bytes':output.stat().st_size}
assert len(sizes)==4, f'Expected four posters, got {len(sizes)}'
manifest={
    'scene':'Sentinel / Reveal',
    'created':'2026-10-14',
    'renderer':'Blender 4.5.14 / Cycles CPU / 24 samples / denoised',
    'geometry':'Supplied assets/models/scam.glb, unchanged; original staging, materials, fragments, lights and cameras authored for this redesign.',
    'source':'design/sentinel-reveal.blend',
    'regenerate':'design/render-scene.py',
    'runtime':'Responsive WebP posters; no runtime WebGL; reduced-motion-aware, event-driven pointer offset.',
    'posters':sizes
}
(root/'design/asset-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
print(json.dumps(sizes,indent=2))
