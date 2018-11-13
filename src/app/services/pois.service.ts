import { Injectable  } from '@angular/core';
import { Http , Response, RequestOptions, Headers } from '@angular/http';
import { DatePipe } from "@angular/common";

import 'rxjs/add/operator/map';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/catch';

import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';
import { environment } from '../../environments/environment';


import {
  MqttMessage,
  MqttModule,
  MqttService
} from 'ngx-mqtt';

import { Pois } from '../models/pois';
import * as L from 'leaflet';

@Injectable()
export class PoisService {

  private selectedSensorSource = new Subject<Pois>();
  selectedSensor$ = this.selectedSensorSource.asObservable();

  pin_pois = L.icon({
    iconUrl: "../assets/pois.svg", // From https://www.iconfinder.com/search/?price=free
    iconSize:     [30, 30], // size of the icon
    iconAnchor:   [15, 30], // point of the icon which will correspond to marker's location
    popupAnchor:  [0, -30] // point from which the popup should open relatixe to the iconAnchor
  });


  private markersMap = {}; // id: marker -> para dar o update ao marker certo

  private stationsApiUrl = environment.orion_url + '/v2/entities/?type=PointOfInterest&options=keyValues&orderBy=dateCreated&limit=1000' ;


  constructor(private http: Http,private _mqttService: MqttService, private datePipe: DatePipe) { }


  getPois() {
    let myHeaders = new Headers(
        {   'fiware-service': 'default',
            'fiware-servicepath': '/',
            // 'Content-Type': 'application/json',
            // 'Accept': 'application/json',
            // 'Access-Control-Allow-Origin': '*'
        });

    let options = new RequestOptions({ headers: myHeaders });
    return this.http.get(this.stationsApiUrl, options=options)
      .map((response: Response) => {
        return <PoisService[]> response.json();
      })
      .catch(err => {
        throw new Error(err.message)
      });
  }

  addToCluster(sensorArray, cluster: L.MarkerClusterGroup): void{
    for (let sensor of sensorArray){
      if (sensor['location']) {

        var popContent;

        if (sensor['url']) {
          sensor['image'] = sensor['url']
        }
        if(sensor['location']){
          popContent = '<b> Point of Interest Information</b><br/>' +
          '<br/><table class="table">'+ '<tr><td><span class="glyphicon glyphicon-scale" aria-hidden="true"></span></td>'+'<td> '+  sensor['id']  + '</td></tr>'
          +'<tr><td><span class="glyphicon glyphicon-home" aria-hidden="true"></span></td>'+'<td> ' + sensor['address']['addressLocality'] + '</td></tr>'
          +'<tr><td><span class="glyphicon glyphicon-eye-open" aria-hidden="true"></span></td>'+'<td> ' + sensor['name'] + '</td></tr>'
          +'<tr><td><span class="glyphicon glyphicon-time" aria-hidden="true"></span></td>'+'<td> ' + this.datePipe.transform(sensor['dateCreated'],"dd-MM-yy HH:mm:ss") + '</td></tr>'
          '</table>'
        }

        var marker = L.marker( [parseFloat(sensor['location']['coordinates'][1]),parseFloat(sensor['location']['coordinates'][0])], {
          icon: this["pin_pois"]
        }).bindPopup(popContent);




        this.markersMap[sensor.id] = marker;

        marker.addEventListener("popupopen", (e) => {
          this.selectedSensorSource.next(sensor);
        });
        marker.addEventListener("popupclose",(e) => {
          this.selectedSensorSource.next(null);
        });
        cluster.addLayer(marker);

      }

    }
  }
}
