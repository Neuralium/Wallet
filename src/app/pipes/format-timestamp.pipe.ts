import { Pipe, PipeTransform } from '@angular/core';
import { DatePipe } from '@angular/common';
import { DateTime } from 'luxon';

@Pipe({
  name: 'FormatTimestamp'
})
export class FormatTimestampPipe implements PipeTransform {

  transform(value:  DateTime, format?: string): any {
    if(!value || value.year === 1){
      return null;
    }
    else{

      let date:string;
      if(format){

        date= value.toFormat(format);
      }
      else{
        date = value.toLocaleString(DateTime.DATE_FULL);
      }
      return date;
    }
    
  }

}

@Pipe({
  name: 'formatDateWithTime'
})
export class FormatDateWithTime extends DatePipe implements PipeTransform {

  transform(value:  DateTime, args?: any): any {
    if(!value || value.year === 1){
      return null;
    }
    else{

      return value.toLocaleString(DateTime.DATE_FULL) + ', ' + value.toLocaleString(DateTime.TIME_WITH_SHORT_OFFSET);
    }
    
  }

}
