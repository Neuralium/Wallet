import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatNeuralium'
})
export class FormatNeuraliumPipe implements PipeTransform {

  transform(value: any, args?: any): any {
    if(value && value !== ''){
    return Number(value).toFixed(9).toString();
    }
    else{
      return (0).toFixed(9).toString();
    }
  }

}
