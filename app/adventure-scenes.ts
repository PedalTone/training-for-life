export const adventureScenes = {
  walk: { name: 'Walking trail', position: 'center' },
  strength: { name: 'Indoor strength room', position: '0% 0%' },
  speed: { name: 'Running on the track', position: '100% 0%' },
  aerobic: { name: 'Easy riverside jog', position: '0% 50%' },
  mobility: { name: 'Indoor mobility studio', position: '100% 50%' },
  endurance: { name: 'Long winding trail', position: '0% 100%' },
  yoga: { name: 'Indoor yoga studio', position: 'center' },
  pilates: { name: 'Indoor Pilates studio', position: 'center' },
  swimming: { name: 'Outdoor lap pool', position: 'center' },
  pickleball: { name: 'Pickleball court', position: 'center' },
  tennis: { name: 'Tennis court', position: 'center' },
  basketball: { name: 'Basketball court', position: 'center' },
  rest: { name: 'Quiet beach', position: '100% 100%' },
} as const;
function artworkKey(key: string) {
  let name = key;
  if (key.startsWith('custom:')) { try { name = decodeURIComponent(key.slice(7)); } catch { return key; } }
  const normalized = name.trim().toLowerCase();
  return normalized === 'swim' ? 'swimming' : normalized;
}
export function adventureSceneFor(key: string) {
  key = artworkKey(key);
  return adventureScenes[key as keyof typeof adventureScenes] || adventureScenes.mobility;
}

export function adventureBackgroundFor(key: string) {
  key = artworkKey(key);
  const scene = adventureSceneFor(key);
  const assets: Record<string,string> = { walk: 'endurance-trail.png', speed: 'speed-2026.10.11.jpg', yoga: 'yoga-2026.10.11.jpg', pilates: 'pilates-2026.10.11.jpg', swimming: 'swimming-2026.10.11.jpg', pickleball: 'pickleball-2026.10.11.jpg', tennis: 'tennis-2026.10.11.jpg', basketball: 'basketball-2026.10.11.jpg', endurance: 'endurance-trail.png', strength: 'strength-kettlebell-2026.10.11.png', mobility: 'mobility-rear-view-2026.10.11.png', aerobic: 'aerobic-woman-2026.10.11.png' };
  return assets[key]
    ? { backgroundImage: `url(./${assets[key]})`, backgroundPosition: 'center', backgroundSize: 'cover' }
    : { backgroundImage: 'url(./adventure-terrain.png)', backgroundPosition: scene.position, backgroundSize: '200% 300%' };
}
