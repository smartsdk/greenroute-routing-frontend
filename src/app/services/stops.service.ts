import { Injectable } from '@angular/core';
import { Http , Response } from '@angular/http';

import 'rxjs/add/operator/map';
import 'rxjs/add/operator/do';
import { Observable } from 'rxjs/Observable';

import { Stop } from '../models/stop';


@Injectable()
export class StopsService {
  private stopsApiUrl = "https://routing.smartsdk.ubiwhere.com/otp/routers/default/index/stops/";
  constructor(private http: Http) { }


  getStops() : Observable<Stop[]> {
    return this.http.get(this.stopsApiUrl)
      .map((response: Response) => <Stop[]> response.json());
  }

  getStop(id:string) : Observable<Stop> {
    return this.http.get(this.stopsApiUrl+id)
    .map((response: Response) => {
      return <Stop> response.json();
    });
  }

  public getJSON(): Observable<any> {
    return this.http.get("./assets/stops-config.json")
          .map((res) => res.json()).catch(err=>{throw new Error(err.message)});
  }

}
