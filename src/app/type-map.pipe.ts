import { Pipe, PipeTransform } from '@angular/core';
import { Event, Type } from './user-data.service';

@Pipe({
    name: 'typeMap',
})
export class TypeMapPipe implements PipeTransform {
    transform(value: {key: string, value: Type}[], args?: any): any {
        const result = {};

        if (!value || !value.length) {
            return null;
        }
        for (const type of value) {
            // firebase eats empty arrays, so make sure we remake
            // them if the data is missing
            const details = type.value.details || [];
            result[type.value.name] = details;
        }
        return result;
    }
}
