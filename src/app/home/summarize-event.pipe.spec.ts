import { SummarizeEventPipe } from './summarize-event.pipe';

describe('SummarizeEventPipe', () => {
    const pipe = new SummarizeEventPipe();

    it('totals time asleep from each activity until the next one', () => {
        // Activities are stored newest first
        const summary = pipe.transform({
            date: '2026-10-13',
            activities: [
                { activity: 'awake', activityDetails: '', time: '2026-10-13T11:00' },
                { activity: 'asleep', activityDetails: 'crib', time: '2026-10-13T09:30' },
                { activity: 'feed', activityDetails: 'left', time: '2026-10-13T09:00' },
                { activity: 'asleep', activityDetails: '', time: '2026-10-13T08:00' },
            ],
        });
        expect(summary.totalTimes['asleep']).toBe(150);
        expect(summary.totalPretty['asleep']).toBe('2.5h');
        expect(summary.totalPretty['feed']).toBe('30m');
    });

    it('returns empty totals for a day without activities', () => {
        const summary = pipe.transform({ date: '2026-10-13', activities: [] });
        expect(summary.totalPretty).toEqual({});
    });
});
