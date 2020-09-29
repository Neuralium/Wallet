import { Pipe, PipeTransform } from '@angular/core';
import { DatePipe } from '@angular/common';
import { DateTime, Duration } from 'luxon';

@Pipe({
  name: 'formatTimelineTime'
})
export class FormatTimelineTimePipe extends DatePipe implements PipeTransform {

  transform(value: Duration, args?: any): any {
    if (value) {

      return value.toFormat('hh:mm:ss');
    }

    return null;
  }
}

@Pipe({
  name: 'formatETATime'
})
export class FormatETATimePipe extends DatePipe implements PipeTransform {

  transform(value: Duration, args?: any): any {
    if (value) {

      const shifted = value.shiftTo('days', 'hours', 'minutes', 'seconds');

      let result = '';

      if (shifted.days > 0) {
        result += shifted.days;
        if (shifted.days === 1) {
          result += ' day ';
        } else {
          result += ' days ';
        }
      }
      if (shifted.hours > 0) {
        result += shifted.hours;
        if (shifted.hours === 1) {
          result += ' hour ';
        } else {
          result += ' hours ';
        }
      }
      if (shifted.minutes > 0) {
        result += shifted.minutes;
        if (shifted.minutes === 1) {
          result += ' minute ';
        } else {
          result += ' minutes ';
        }
      }

      result += shifted.seconds;
        if (shifted.seconds <= 1) {
          result += ' second ';
        } else {
          result += ' seconds ';
        }

      return result;
    }

    return null;
  }
}

@Pipe({
  name: 'formatTimelineTime2'
})
export class FormatTimelineTimePipe2 extends DatePipe implements PipeTransform {

  transform(value:  DateTime, args?: any): any {
    if (value) {

      return value.toFormat('HH:mm:ss');
    }

    return null;
  }

}

