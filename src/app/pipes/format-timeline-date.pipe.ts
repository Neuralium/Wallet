import { Pipe, PipeTransform } from '@angular/core';
import { DatePipe } from '@angular/common';
import { DateTime } from 'luxon';

@Pipe({
  name: 'formatTimelineDate'
})
export class FormatTimelineDatePipe extends DatePipe implements PipeTransform {

  transform(value:  string|null|undefined, args?: string): any {
    const casted:DateTime = <DateTime><unknown>value;
    if(casted){
      return casted.toFormat('MMM dd, yyyy');
    }
    
    return null;
    
  }

}
