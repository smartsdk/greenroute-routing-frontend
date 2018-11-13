import { Injectable  } from '@angular/core';
import { Http , Response, RequestOptions, Headers } from '@angular/http';
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
    private url = 'https://google.com' ;

    constructor(private http: Http,private _mqttService: MqttService, private datePipe: DatePipe) { }

    getUserItineraries(){
        let myHeaders = new Headers({
            'fiware-service': 'default',
            'fiware-servicepath': '/',
        });

        let options = new RequestOptions({ headers: myHeaders });

        return this.http.get(this.url, options=options).map((response: Response) => {
            return <Itineraries[]> response.json();
        }).catch(err=>{throw new Error(err.message)});
    }

}
