export const adventureScenes = {
  strength: { name: 'Indoor strength room', position: '0% 0%' },
  speed: { name: 'Downhill switchbacks', position: '100% 0%' },
  aerobic: { name: 'Easy riverside jog', position: '0% 50%' },
  mobility: { name: 'Indoor mobility studio', position: '100% 50%' },
  endurance: { name: 'Long winding trail', position: '0% 100%' },
  rest: { name: 'Quiet beach', position: '100% 100%' },
} as const;
export function adventureSceneFor(key: string) {
  return adventureScenes[key as keyof typeof adventureScenes] || adventureScenes.mobility;
}

export function adventureBackgroundFor(key: string) {
  const scene = adventureSceneFor(key);
  const assets: Record<string,string> = { endurance: 'endurance-trail.png', strength: 'strength-kettlebell-2026.10.11.png', mobility: 'mobility-rear-view-2026.10.11.png', aerobic: 'aerobic-woman-2026.10.11.png' };
  return assets[key]
    ? { backgroundImage: `url(./${assets[key]})`, backgroundPosition: 'center', backgroundSize: 'cover' }
    : { backgroundImage: 'url(./adventure-terrain.png)', backgroundPosition: scene.position, backgroundSize: '200% 300%' };
}
