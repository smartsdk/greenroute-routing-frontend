import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';


import { Http , Response, URLSearchParams, RequestOptions } from '@angular/http';
import { CookieService } from 'angular2-cookie/core';
import { environment } from '../../environments/environment';

import 'rxjs/add/operator/toPromise';


@Injectable()
export class RoutesService {

  constructor(private http:Http, private cookieService: CookieService) { }

  private endPoint = 'https://routing-plan.smartsdk.ubiwhere.com/api/routing/';
  private nominatim = 'https://nominatim.smartsdk.ubiwhere.com/search.php';
  private nominatimReverse = 'https://nominatim.smartsdk.ubiwhere.com/reverse.php';
  private greenRouteAPI = environment.backend_url;


  calculate(obj): Observable<any>{
    let params = new URLSearchParams();
    for(let key in obj){
      params.set(key,obj[key]);
    }
    return this.http.get(this.endPoint,{params:params}).map(res => res.json())
    .catch(err=>{
      throw new Error(err.json().detail.msg);
    });

  }

  saveRoute(input){
    var tokeninfo = JSON.parse(this.cookieService.getObject('token-info').toString());
    var userID = tokeninfo.id;
    var userToken = tokeninfo.tokenInfo.token;

    sessionStorage.setItem('userID', userID);
    sessionStorage.setItem('userToken', userToken);

    let SaveRouteURL = this.greenRouteAPI + 'trips/user/' + userID

    return fetch(SaveRouteURL, {
      method: 'POST',
      body: JSON.stringify(input),
      headers:{
        'X-Auth-Token': userToken,
        'Content-Type': 'application/json'
      }
    })
  }


  searchLocation(input){
    let params = new URLSearchParams();
    params.set("q",input);
    params.set("format","json");
    params.set("polygon","1");
    params.set("addressdetails","1");
    return this.http.get(this.nominatim,{params:params}).map(res => res.json());
  }

  searchLocationReverse(input){
    let params = new URLSearchParams();
    params.set("lat",input.split(',')[0]);
    params.set("lon",input.split(',')[1]);
    params.set("format","json");
    params.set("polygon","1");
    params.set("addressdetails","1");
    return this.http.get(this.nominatimReverse,{params:params}).map(res => res.json());
  }


  public getConfig(): Observable<any> {
    return this.http.get("./assets/config.json")
          .map((res) => res.json()).catch(err=>{throw new Error(err.message)});
  }
}
