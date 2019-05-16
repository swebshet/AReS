import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs'
import { first } from 'rxjs/operators'
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  dataUrl = environment.baseApiUrl;  // URL to web api
  searchUrl = this.dataUrl + 'search'
  keysUrl = this.dataUrl + 'keys'
  valuesUrl = this.dataUrl + 'values'
  constructor(private http: HttpClient) { }

  getDefaultData(pdata): Observable<any> {
    return this.http.post(this.dataUrl, pdata).pipe(first())
  }

  search(query: any): Observable<any> {
    return this.http.post(this.searchUrl, query).pipe(first())
  }

  scroll(query: any): Observable<any> {
    return Observable.create(subscriber => {
      const getBatch = scrollId => this.http.post(this.dataUrl + 'scroll', { scroll_id: scrollId })
      this.http.post(this.searchUrl + '?scroll=1m', query).subscribe(async initBatch => {
        subscriber.next(initBatch)
        let scrollId = initBatch['_scroll_id']
        while (scrollId) {
          const batch = await getBatch(scrollId).pipe(first()).toPromise()
          if (batch['hits'].hits.length > 0)
            subscriber.next(batch)
          else break
          scrollId = batch['_scroll_id']
        }
        subscriber.complete()
      })
    })
  }

  getValues() {
    return this.http.get(this.valuesUrl);
  }

  getkeys() {
    return this.http.get(this.keysUrl);
  }

  savekeys(data) {
    return this.http.post(this.keysUrl, data)
  }

  saveValues(data) {
    return this.http.post(this.valuesUrl, data)
  }

}

