import { Pipe, PipeTransform } from '@angular/core';
import { DatePipe } from '@angular/common';
import { DateTime } from 'luxon';

@Pipe({
  name: 'formatTimelineDate'
})
export class FormatTimelineDatePipe extends DatePipe implements PipeTransform {

  transform(value:  DateTime, args?: any): any {
    if(value){
      return value.toFormat('MMM dd, yyyy');
    }
    
    return null;
    
  }

}
