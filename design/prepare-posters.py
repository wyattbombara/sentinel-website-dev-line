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
    'scene':'Sentinel / The Evidence Room',
    'created':'2026-10-14',
    'renderer':'Three.js 0.186.1 / runtime WebGL scene captured with software rendering',
    'geometry':'Supplied assets/models/scam.glb, unchanged; authored gallery architecture, reflective floor, typographic exhibits, materials, lighting, camera and motion.',
    'source':'design/hero-scene.mjs',
    'regenerate':'design/capture-posters.cjs then design/prepare-posters.py',
    'earlier_study':'design/sentinel-reveal.blend and design/render-scene.py retain the first Blender composition study.',
    'runtime':'Lazy 3D enhancement capped at 30 fps and bounded pixel density; pauses offscreen/hidden/manually; WebP fallback for reduced motion, data saving, and unavailable WebGL.',
    'posters':sizes
}
(root/'design/asset-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
print(json.dumps(sizes,indent=2))
