import { Injectable  } from '@angular/core';
import { Http , Response, RequestOptions, Headers } from '@angular/http';
import { CookieService } from 'angular2-cookie/core';
import { DatePipe } from "@angular/common";

import 'rxjs/add/operator/map';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/catch';

import { Subject }    from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';
import { environment } from '../../environments/environment';

import {
  MqttMessage,
  MqttModule,
  MqttService
} from 'ngx-mqtt';

import * as L from 'leaflet';
import { Itineraries } from '../models/itineraries';

@Injectable()
export class MyItinerariesService {
    private greenRouteAPI = environment.backend_url;

    constructor(private http: Http,private _mqttService: MqttService, private datePipe: DatePipe, private cookieService: CookieService) { }

    getUserItineraries(){
        var tokeninfo = JSON.parse(this.cookieService.getObject('token-info').toString());
        var userID = tokeninfo.id;
        var userToken = tokeninfo.tokenInfo.token;

        let myHeaders = new Headers({
            'X-Auth-Token': userToken,
            'Content-Type': 'application/json'
        });

        let options = new RequestOptions({ headers: myHeaders });
        let itinerariesUrl = this.greenRouteAPI + 'trips/user/' + userID;

        return this.http.get(itinerariesUrl, options=options).map((response: Response) => {
            console.log(response.json());
            return <Itineraries[]> response.json();
        }).catch(err=>{throw new Error(err.message)});
    }

}
