// Pop-up illustrations a notice can open with. Each one is drawn for a particular kind of notice;
// a notice without one shows the school from the cover instead.
export const sceneNames = ['letter', 'activities', 'dining', 'holiday', 'timetable', 'playground', 'lunchtime', 'castanyada', 'gym', 'cafe'] as const;
export type SceneName = typeof sceneNames[number];
