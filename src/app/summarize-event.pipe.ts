import { Pipe, PipeTransform } from '@angular/core';
import { Event } from './user-data.service';

// @TODO it looks like we store null/empty details by default, but the user thinks they have picked something
const SLEEPDEFAULT = 'crib';

@Pipe({
    name: 'summarizeEvent',
})
export class SummarizeEventPipe implements PipeTransform {
    transform(value: Event, args?: any): any {
        const event: Event = Object.assign(value);

        let lastActivity;
        const maxTimes = {},
            totalTimes = {},
            totalPretty = {};
        console.log(event.activities);
        const sleepChart = [
            ...new Set(
                event.activities
                    .filter(activity => activity.activity === 'asleep')
                    .map(activity => ({ name: activity.activityDetails || SLEEPDEFAULT, value: 0 }))
            ),
        ];

        const summary = {
            maxTimes: maxTimes,
            totalTimes: totalTimes,
            sleepChart: sleepChart,
            totalPretty: totalPretty,
        };

        if (!value || !value.activities || value.activities.length <= 0) {
            return summary;
        }

        for (const activity of value.activities) {
            // Generate summary for this "event" or day
            // Calculate stats by activity type
            // Remember that event 0 is the most recent!

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
                // Now we have minutes tracking how long the activity was, we lose the first

                totalTimes[activity.activity] += minutes;
                if (activity.activity === 'asleep') {
                    sleepChart.find(
                        type => type.name === (activity.activityDetails || SLEEPDEFAULT)
                    ).value += minutes;
                }
                maxTimes[activity.activity] = Math.max(minutes, maxTimes[activity.activity]);
            }
            lastActivity = activity;
        }

        for (const key of Object.keys(totalTimes)) {
            if (totalTimes[key] > 60) {
                totalPretty[key] = Math.round((totalTimes[key] / 60) * 10) / 10 + 'h';
            } else {
                totalPretty[key] = totalTimes[key] + 'm';
            }
        }

        return summary;
    }
}
