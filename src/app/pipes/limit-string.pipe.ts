import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'limitString'
})
export class LimitStringPipe implements PipeTransform {

  transform(value: string, limit: number): any {
    if(value && value !== "" && value.length > limit){
      return value.substr(0,limit) + "...";
    }
    else{
      return value;
    }
    
  }

}
