import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoadAssetsFilesService implements OnDestroy {

  constructor(private http: HttpClient) { }

  private unsubscribe$ = new Subject<void>();

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }


  getFile(fileName:string){
    return this.http.get("/assets/files/"+fileName,{responseType: 'text'});
  }
}
