import { Injectable  } from '@angular/core';
import { Http , Response, RequestOptions, Headers } from '@angular/http';
import { DatePipe } from "@angular/common";

import 'rxjs/add/operator/map';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/catch';

import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';



import {
  MqttMessage,
  MqttModule,
  MqttService
} from 'ngx-mqtt';

import { Alert } from '../models/alert';
import * as L from 'leaflet';

@Injectable()
export class AlertService {

  private selectedSensorSource = new Subject<Alert>();
  selectedSensor$ = this.selectedSensorSource.asObservable();

  pin_alert_informational = L.icon({
    iconUrl: "../assets/pin-alert-informational.png", // From https://www.iconfinder.com/search/?price=free
    iconSize:     [40, 40], // size of the icon
    iconAnchor:   [20, 40], // point of the icon which will correspond to marker's location
    popupAnchor:  [0, -40] // point from which the popup should open relatixe to the iconAnchor
  });
  pin_alert_low = L.icon({
    iconUrl: "../assets/pin-alert-low.png", // From https://www.iconfinder.com/search/?price=free
    iconSize:     [40, 40], // size of the icon
    iconAnchor:   [20, 40], // point of the icon which will correspond to marker's location
    popupAnchor:  [0, -40] // point from which the popup should open relatixe to the iconAnchor
  });
  pin_alert_medium = L.icon({
    iconUrl: "../assets/pin-alert-medium.png", // From https://www.iconfinder.com/search/?price=free
    iconSize:     [40, 40], // size of the icon
    iconAnchor:   [20, 40], // point of the icon which will correspond to marker's location
    popupAnchor:  [0, -40] // point from which the popup should open relatixe to the iconAnchor
  });
  pin_alert_critical = L.icon({
    iconUrl: "../assets/pin-alert-critical.png", // From https://www.iconfinder.com/search/?price=free
    iconSize:     [40, 40], // size of the icon
    iconAnchor:   [20, 40], // point of the icon which will correspond to marker's location
    popupAnchor:  [0, -40] // point from which the popup should open relatixe to the iconAnchor
  });
  pin_alert_high = L.icon({
    iconUrl: "../assets/pin-alert-high.png", // From https://www.iconfinder.com/search/?price=free
    iconSize:     [40, 40], // size of the icon
    iconAnchor:   [20, 40], // point of the icon which will correspond to marker's location
    popupAnchor:  [0, -40] // point from which the popup should open relatixe to the iconAnchor
  });


  private markersMap = {}; // id: marker -> para dar o update ao marker certo

  private stationsApiUrl = 'http://79.109.226.53:1026/v2/entities/?type=Alert&options=keyValues&limit=1000&orderBy=!dateObserved' ;

  constructor(private http: Http,private _mqttService: MqttService, private datePipe: DatePipe) { }


  getAlert() {
    let myHeaders = new Headers(
        {   'fiware-service': 'default',
            'fiware-servicepath': '/'
        });
    let options = new RequestOptions({ headers: myHeaders });
    return this.http.get(this.stationsApiUrl, options=options)
      .map((response: Response) => {
        return <AlertService[]> response.json();
      })
      .catch(err => {throw new Error(err.message)});
  }


  addToCluster(sensorArray, cluster: L.MarkerClusterGroup): void{
      for (let sensor of sensorArray){
        if (sensor['location']) {
          var pollutants = [];
          console.log("cenas\n")
          console.log(sensor)

          var popContent;

            popContent = '<b> Alert Information</b><br/>' +
            '<br/><table class="table">'+ '<tr><td><span class="glyphicon glyphicon-scale" aria-hidden="true"></span></td>'+'<td> '+  sensor['id'] + '</td></tr>' 
            +'<tr><td><span class="glyphicon glyphicon-time" aria-hidden="true"></span></td>'+'<td> ' + this.datePipe.transform(sensor['dateTime'],"dd-MM-yy HH:mm:ss") + '</td></tr>'
            +'<tr><td><span class="glyphicon glyphicon-cog" aria-hidden="true"></span></td>'+'<td> ' + sensor['alertSource'] + '</td></tr>'
            +'<tr><td><span class="glyphicon glyphicon-tag" aria-hidden="true"></span></td>'+'<td> ' + sensor['category'].charAt(0).toUpperCase() + sensor['category'].slice(1) +  " - " + sensor['subCategory'] + '</td></tr>'
            +'<tr><td><span class="glyphicon glyphicon-bullhorn" aria-hidden="true"></span></td>'+'<td> ' + sensor['description'] + '</td></tr>'
            '</table>'
            
          if (sensor['severity'] == null){
            sensor['severity'] = "informational"
          }
          var marker = L.marker( [parseFloat(sensor['location']['coordinates'][0]),parseFloat(sensor['location']['coordinates'][1])], {
            icon: this["pin_alert_" + sensor['severity']]
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

  getUpdates(cluster: L.MarkerClusterGroup) {
    var pollutants = [];
    this._mqttService.observe('alertsobserved').subscribe((message:MqttMessage) => {
      var updated = <Alert[]> JSON.parse(message.payload.toString()).data; 
      console.log("--------------------UPDATED ALERT-------------------\n");
      console.log(updated)
      console.log("-----------\n")
       for(let sensor of updated){
        var marker: L.Marker = this.markersMap[sensor.id];
        if(marker){
         var popContent = '<b> Alert Information</b><br/>' +
            '<br/><table class="table">'+ '<tr><td><span class="glyphicon glyphicon-scale" aria-hidden="true"></span></td>'+'<td> '+  sensor['id'] + '</td></tr>' 
            +'<tr><td><span class="glyphicon glyphicon-time" aria-hidden="true"></span></td>'+'<td> ' + this.datePipe.transform(sensor['dateObserved'],"dd-MM-yy HH:mm:ss") + '</td></tr>'
            +'<tr><td><span class="glyphicon glyphicon-cog" aria-hidden="true"></span></td>'+'<td> ' + sensor['alertSource'] + '</td></tr>'
            +'<tr><td><span class="glyphicon glyphicon-tag" aria-hidden="true"></span></td>'+'<td> ' + sensor['category'].charAt(0).toUpperCase() + sensor['category'].slice(1) +  " - " + sensor['subCategory'] + '</td></tr>'
            +'<tr><td><span class="glyphicon glyphicon-bullhorn" aria-hidden="true"></span></td>'+'<td> ' + sensor['description'] + '</td></tr>'
            '</table>'
          
          if (sensor['severity'] == null){
            sensor['severity'] = "informational"
          }

          marker.setIcon(this["pin_alert_" + sensor['severity']]).bindPopup(popContent);

      }
      else {
        if (sensor['location']){
          let popContent;

          popContent = '<b> Alert Information</b><br/>' +
              '<br/><table class="table">'+ '<tr><td><span class="glyphicon glyphicon-scale" aria-hidden="true"></span></td>'+'<td> '+  sensor['id'] + '</td></tr>' 
              +'<tr><td><span class="glyphicon glyphicon-time" aria-hidden="true"></span></td>'+'<td> ' + this.datePipe.transform(sensor['dateObserved'],"dd-MM-yy HH:mm:ss") + '</td></tr>'
              +'<tr><td><span class="glyphicon glyphicon-cog" aria-hidden="true"></span></td>'+'<td> ' + sensor['alertSource'] + '</td></tr>'
              +'<tr><td><span class="glyphicon glyphicon-tag" aria-hidden="true"></span></td>'+'<td> ' + sensor['category'].charAt(0).toUpperCase() + sensor['category'].slice(1) +  " - " + sensor['subCategory'] + '</td></tr>'
              +'<tr><td><span class="glyphicon glyphicon-bullhorn" aria-hidden="true"></span></td>'+'<td> ' + sensor['description'] + '</td></tr>'
              '</table>'
          
          if (sensor['severity'] == null){
            sensor['severity'] = "informational"
          }
          
          var marker = L.marker( [sensor['location'].coordinates[0],sensor['location'].coordinates[1]], {
            icon: this["pin_alert_" + sensor['severity']]
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
  });
}

  getAlerts(){
    return this._mqttService.observe('alerts');
  }

}
