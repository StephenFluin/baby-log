import { Pipe, PipeTransform } from '@angular/core';
import { Event } from './user-data.service';

@Pipe({
    name: 'summarizeEvent',
})
export class SummarizeEventPipe implements PipeTransform {
    transform(value: Event, args?: any): any {
        const event: Event = Object.assign(value);


        let lastActivity;
        const maxTimes = {};
        const totalTimes = {};
        const summary = {maxTimes: maxTimes, totalTimes: totalTimes};

        if (!value || !value.activities || value.activities.length <= 0) {
            return summary;
        }

        for (const activity of value.activities) {
            // Generate summary for this "event" or day
            // Calculate stats by activity type

            if (lastActivity) {
                const minutes = Math.round(
                    (new Date(lastActivity.time).getTime() - new Date(activity.time).getTime()) /
                        1000 /
                        60
                );
                if (!totalTimes[activity.activity]) {
                    totalTimes[activity.activity] = 0;
                    maxTimes[activity.activity] = 0;
                }
                totalTimes[activity.activity] += minutes;
                maxTimes[activity.activity] = Math.max(minutes, maxTimes[activity.activity]);
            }
            lastActivity = activity;
        }

        return summary;
    }
}
