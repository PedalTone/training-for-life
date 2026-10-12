type PhotoSession = { workoutPhoto?: string; workoutPhotos?: string[] };
export function workoutPhotos(session: PhotoSession): string[] {
 const photos = Array.isArray(session.workoutPhotos) ? session.workoutPhotos.filter(photo => typeof photo === 'string' && photo.startsWith('data:image/')) : [];
 return photos.length ? photos : session.workoutPhoto ? [session.workoutPhoto] : [];
}
