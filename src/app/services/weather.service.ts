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

import { Weather } from '../models/weather';
import * as L from 'leaflet';

@Injectable()
export class WeatherService {

  private selectedSensorSource = new Subject<Weather>();
  selectedSensor$ = this.selectedSensorSource.asObservable();

  pin_weather = L.icon({
    iconUrl: "../assets/pin-weather5.png", // From https://www.iconfinder.com/search/?price=free
    iconSize:     [30, 30], // size of the icon
    iconAnchor:   [15, 30], // point of the icon which will correspond to marker's location
    popupAnchor:  [0, -30] // point from which the popup should open relatixe to the iconAnchor
  });


  private markersMap = {}; // id: marker -> para dar o update ao marker certo

  private stationsApiUrl = environment.orion_url + '/v2/entities/?options=keyValues&type=WeatherObserved&limit=1000&orderBy=!dateObserved';

  constructor(private http: Http,private _mqttService: MqttService, private datePipe: DatePipe) { }


  getWeather() {
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
        return <WeatherService[]> response.json();
      })
      .catch(err => {throw new Error(err.message)});
  }


  public getJSON(): Observable<any> { // Not used (next method -> addToCluster)
        return this.http.get('./assets/weather-config.json')
                        .map((res) => res.json()).catch(err => {throw new Error(err.message)});
    }


  addToCluster(sensorArray, cluster: L.MarkerClusterGroup): void{
    this.getJSON().subscribe(config => {
      for (let sensor of sensorArray){
        if (sensor['location']) {
          var pollutants = [];

          var popContent;

          for(var key in config){ // todos os poluentes no weather-config.json
            if(sensor[key]){     // se existir um valor para esse poluente
              var dataObject={};
              if(sensor[key]!=="nr")
                dataObject["value"] = sensor[key];
              else
                dataObject["value"] = "-";

              dataObject["tag"] = config[key]["tag"];

              dataObject["unit"] = config[key]["unit"];
              dataObject["name"] = config[key]["name"];
              dataObject["color"] = "#2a4c82";

              pollutants.push(dataObject);
            }
            else{
              console.log("404 pollutant "+key+" not found on "+sensor.id);
            }

          }
          sensor["pollutants"] = pollutants

          if(sensor['address']){
            popContent = '<b> Weather Information</b><br/>' +
            '<br/><table class="table">'+ '<tr><td><span class="glyphicon glyphicon-scale" aria-hidden="true"></span></td>'+'<td> '+  sensor['id']  + '</td></tr>'
            +'<tr><td><span class="glyphicon glyphicon-home" aria-hidden="true"></span></td>'+'<td> ' + sensor['address']['streetAddress'] + ', ' + sensor['address']['addressLocality']
            + ', ' + sensor['address']['addressCountry'] + '</td></tr>'
            +'<tr><td><span class="glyphicon glyphicon-time" aria-hidden="true"></span></td>'+'<td> ' + this.datePipe.transform(sensor['dateObserved'],"dd-MM-yy HH:mm:ss") + '</td></tr>'
            '</table>'
            }


          var marker = L.marker( [sensor['location'].coordinates[1],sensor['location'].coordinates[0]], {
            icon: this["pin_weather"]
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

      }});
  }

  getUpdates() {
    var pollutants = [];
    this._mqttService.observe('weatherobserved').subscribe((message:MqttMessage) => {
      var updated = <Weather[]> JSON.parse(message.payload.toString()).data;
      console.log("--------------------UPDATED WEATHER-------------------\n");
      console.log(updated)
      console.log("-----------\n")
       for(let sensor of updated){
        var marker: L.Marker = this.markersMap[sensor.id];
        if(marker){
          this.getJSON().subscribe(config => {
            for(var key in config){ // todos os poluentes no weather-config.json
              if(sensor[key]){     // se existir um valor para esse poluente
                var dataObject={};
                if(sensor[key]!=="nr")
                  dataObject["value"] = sensor[key];
                else
                  dataObject["value"] = "-";
                dataObject["tag"] = config[key]["tag"];

                dataObject["unit"] = config[key]["unit"];
                dataObject["name"] = config[key]["name"];
                dataObject["color"] = "#2e61b2";

                pollutants.push(dataObject);
              }
              else{
                console.log("404 pollutant "+key+" not found on "+sensor.id);
              }

            }
            sensor["pollutants"] = pollutants

            var popContent = '<b> Weather Information</b><br/>' +
            '<br/><table class="table">'+ '<tr><td><span class="glyphicon glyphicon-scale" aria-hidden="true"></span></td>'+'<td> '+  sensor['id']  + '</td></tr>'
            +'<tr><td><span class="glyphicon glyphicon-home" aria-hidden="true"></span></td>'+'<td> ' + sensor['address']['streetAddress'] + ', ' + sensor['address']['addressLocality']
            + ', ' + sensor['address']['addressCountry'] + '</td></tr>'
            +'<tr><td><span class="glyphicon glyphicon-time" aria-hidden="true"></span></td>'+'<td> ' + this.datePipe.transform(sensor['dateObserved'],"dd-MM-yy HH:mm:ss") + '</td></tr>'
            +'</table>'

            marker.setIcon(this["pin_weather"]).bindPopup(popContent);
          }
      );}
    }
  });

  return pollutants;
}

  getAlerts(){
    return this._mqttService.observe('alerts');
  }

}
