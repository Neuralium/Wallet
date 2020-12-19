import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'values' })
export class ValuesPipe implements PipeTransform {
  transform(value, args: string[]): any {
    let values = []
    for (let key in value) {
      values.push([key, value[key]])
    }
    return values
  }
}