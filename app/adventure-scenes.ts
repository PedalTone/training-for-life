export const adventureScenes = {
  strength: { name: 'Mountain climb', position: '0% 0%' },
  speed: { name: 'Downhill switchbacks', position: '100% 0%' },
  aerobic: { name: 'Riverside path', position: '0% 50%' },
  mobility: { name: 'Wildflower meadow', position: '100% 50%' },
  endurance: { name: 'Long forest trail', position: '0% 100%' },
  rest: { name: 'Quiet beach', position: '100% 100%' },
} as const;
export function adventureSceneFor(key: string) {
  return adventureScenes[key as keyof typeof adventureScenes] || adventureScenes.mobility;
}
