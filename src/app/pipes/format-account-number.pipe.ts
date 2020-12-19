import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatAccountNumber'
})
export class FormatAccountNumberPipe implements PipeTransform {

  transform(value: string, args?: any): any {
    let copy:string = value;
    if (copy.includes('{')===false) { 
      copy = "{" + copy;
    }
    if (copy.includes('}')===false) { 
      copy = copy + "}";
    }
    return copy;
  }

}
