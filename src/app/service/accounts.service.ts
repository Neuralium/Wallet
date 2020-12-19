import { Injectable, OnDestroy } from '@angular/core';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AccountsService implements OnDestroy {

  constructor() { }

  private unsubscribe$ = new Subject<void>();
  private accountIdIntroRegex: RegExp = /^[{]?(?:(?:USER|SERVER|MODERATOR|JOINT)\:|(?:USR|SVR|JT|MOD)\:|[USJM][:]?)/i;
    private accountIdTailRegex: RegExp = /(?:[0-9A-Z][-]?)+[}]?$/i;
    
  private accountIdRegex: RegExp = /^[{]?(?:(?:USER|SERVER|MODERATOR|JOINT)\:|(?:USR|SVR|JT|MOD)\:|[USJM][:]?)(?:[0-9A-Z][-]?)+[}]?$/i;
  private presentationRegex: RegExp = /^[{]?[*]/;

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  // make sure that the acccount Id is surrounded by {} if it is not already
  public FormatAccountId(accountId:string):string{

    let value:string = accountId.replace(/[{}\[\]-]/gi, '').toUpperCase();

    let type:RegExpMatchArray = value.match(this.accountIdIntroRegex);
    if(type.length== 0){
      throw 'Invalid accountId format'
    }
    // slice the intro
    let slicedValue = value.replace(this.accountIdIntroRegex, '');

    let tail:RegExpMatchArray = slicedValue.match(this.accountIdTailRegex);
    if(tail.length== 0){
      throw 'Invalid accountId format'
    }
    
    let groups:RegExpMatchArray = tail[0].match(/.{1,4}/g);
    let adjustedTail:string = groups.join("-");

    let result:string = `{${type[0]}${adjustedTail}}`;

    if(!this.testValidAccountId(result)){
      throw 'Invalid accountId format'
    }
    return result;
  }

  // tells us if it is a valid account ID and no presentation
  testValidAccountId(accountIdValue:string):Boolean{

     return this.accountIdRegex.test(accountIdValue);
  }

  // tells us if it is a presentation account Id
  testPresentation(accountIdValue:string):Boolean{
    
    return this.presentationRegex.test(accountIdValue);
 }
}
