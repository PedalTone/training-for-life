import test from 'node:test';
import assert from 'node:assert/strict';
import { stripVideoGuide, stripSessionGuides } from '../app/video-cleanup.ts';

test('removes legacy guide metadata while preserving video playback fields', () => {
  const video = { url: 'https://youtu.be/test123', label: 'Workout', videoId: 'test123', thumbnailData: 'data:image/png;base64,abc', category: 'strength', workoutGuide: { exercises: [{ name: 'Squat' }] }, guideStatus: 'ready', guideError: 'old error' };
  const clean = stripVideoGuide(video);
  assert.deepEqual(clean, { url: video.url, label: video.label, videoId: video.videoId, thumbnailData: video.thumbnailData, category: video.category });
  assert.ok(video.workoutGuide, 'cleanup must not mutate input');
  assert.equal(stripVideoGuide(clean), clean, 'repeat cleanup is a no-op');
});
test('cleans historical sessions without changing workout data or dates', () => {
  const session = { id: '2026-09-01', date: '2026-09-01', notes: 'Keep this', duration: '30', completedExercises: ['Walking'], updatedAt: 'original', videos: [{ url: 'video', label: 'Video', guideStatus: 'analyzing' }] };
  assert.deepEqual(stripSessionGuides(session), { ...session, videos: [{ url: 'video', label: 'Video' }] });
  const noVideos = { id: 'old-session' };
  assert.equal(stripSessionGuides(noVideos), noVideos);
});
