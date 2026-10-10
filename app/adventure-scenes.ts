export const adventureScenes = {
  strength: { name: 'Mountain climb', position: '0% 0%' },
  speed: { name: 'Downhill switchbacks', position: '100% 0%' },
  aerobic: { name: 'Riverside path', position: '0% 50%' },
  mobility: { name: 'Wildflower meadow', position: '100% 50%' },
  endurance: { name: 'Long winding trail', position: '0% 100%' },
  rest: { name: 'Quiet beach', position: '100% 100%' },
} as const;
export function adventureSceneFor(key: string) {
  return adventureScenes[key as keyof typeof adventureScenes] || adventureScenes.mobility;
}

export function adventureBackgroundFor(key: string) {
  const scene = adventureSceneFor(key);
  return key === 'endurance'
    ? { backgroundImage: 'url(./endurance-trail.png)', backgroundPosition: 'center', backgroundSize: 'cover' }
    : { backgroundImage: 'url(./adventure-terrain.png)', backgroundPosition: scene.position, backgroundSize: '200% 300%' };
}
