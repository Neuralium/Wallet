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

  transform(value:  string|null|undefined, args?: string): any {
    const casted:DateTime = <DateTime><unknown>value;

    if(!casted || casted.year === 1){
      return null;
    }
    else if(args){
      if(args === 'DATETIME_SHORT_WITH_SECONDS'){
        return casted.toLocaleString(DateTime.DATETIME_SHORT_WITH_SECONDS);
      }
    }

      return casted.toLocaleString(DateTime.DATE_FULL) + ', ' + casted.toLocaleString(DateTime.TIME_WITH_SHORT_OFFSET);
  }

}
