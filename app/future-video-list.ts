type SavedVideo = {url:string;videoId?:string;category?:string};
const categories = ['mobility','aerobic','strength','speed','endurance'];
export function filterFutureVideos<T extends SavedVideo>(videos:T[], filter:string):T[] {
 if(filter==='all') return videos;
 if(filter==='uncategorized') return videos.filter(video=>!categories.includes(video.category||''));
 return videos.filter(video=>video.category===filter);
}
export function videoIdentity(video:SavedVideo) {
 return video.videoId || video.url.match(/(?:youtu\.be\/|v=|shorts\/|embed\/)([\w-]{6,})/)?.[1] || video.url.trim();
}
