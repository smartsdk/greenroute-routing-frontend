import { Injectable  } from '@angular/core';
import { Http , Response, RequestOptions, Headers } from '@angular/http';
import { DatePipe } from "@angular/common";

import 'rxjs/add/operator/map';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/catch';

import { Subject }    from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';



import {
  MqttMessage,
  MqttModule,
  MqttService
} from 'ngx-mqtt';

import { Traffic } from '../models/traffic';
import * as L from 'leaflet';
import { style } from '@angular/core/src/animation/dsl';

@Injectable()
export class TrafficService {

  private selectedSensorSource = new Subject<Traffic>();
  selectedSensor$ = this.selectedSensorSource.asObservable();

  pin_green = L.icon({
    iconUrl: "../assets/pin-green.png",
    iconSize:     [35, 55], // size of the icon
    iconAnchor:   [17.5, 55], // point of the icon which will correspond to marker's location
    popupAnchor:  [0, -55] // point from which the popup should open relatixe to the iconAnchor
  });

  pin_yellow = L.icon({
    iconUrl: "../assets/pin-yellow.png",
    iconSize:     [35, 55], // size of the icon
    iconAnchor:   [17.5, 55], // point of the icon which will correspond to marker's location
    popupAnchor:  [0, -55] // point from which the popup should open relatixe to the iconAnchor
  });

  pin_orange = L.icon({
    iconUrl: "../assets/pin-orange.png",
    iconSize:     [35, 55], // size of the icon
    iconAnchor:   [17.5, 55], // point of the icon which will correspond to marker's location
    popupAnchor:  [0, -55] // point from which the popup should open relatixe to the iconAnchor
  });

  pin_red = L.icon({
    iconUrl: "../assets/pin-red.png",
    iconSize:     [35, 55], // size of the icon
    iconAnchor:   [17.5, 55], // point of the icon which will correspond to marker's location
    popupAnchor:  [0, -55] // point from which the popup should open relatixe to the iconAnchor
  });

  pin_purple = L.icon({
    iconUrl: "../assets/pin-purple.png",
    iconSize:     [35, 55], // size of the icon
    iconAnchor:   [17.5, 55], // point of the icon which will correspond to marker's location
    popupAnchor:  [0, -55] // point from which the popup should open relatixe to the iconAnchor
  });

  pin_brown = L.icon({
    iconUrl: "../assets/pin-brown.png",
   iconSize:     [35, 55], // size of the icon
    iconAnchor:   [17.5, 55], // point of the icon which will correspond to marker's location
    popupAnchor:  [0, -55] // point from which the popup should open relatixe to the iconAnchor
  });

  pin_gray = L.icon({
    iconUrl: "../assets/pin-gray.png",
    iconSize:     [35, 55], // size of the icon
    iconAnchor:   [17.5, 55], // point of the icon which will correspond to marker's location
    popupAnchor:  [0, -55] // point from which the popup should open relatixe to the iconAnchor
  });

  private markersMap = {}; // id: marker -> para dar o update ao marker certo

  private stationsApiUrl = 'http://79.109.226.53:1026/v2/entities/?options=keyValues&type=TrafficFlowObserved&limit=1000' ;

  constructor(private http: Http,private _mqttService: MqttService, private datePipe: DatePipe) { }


  getTraffic(offset) {
    let myHeaders = new Headers(
      {   
        'fiware-service': 'default',
        'fiware-servicepath': '/',
        // 'Content-Type': 'application/json',
        // 'Accept': 'application/json',        // 'Access-Control-Allow-Origin': '*'
      });
  
    let options = new RequestOptions({ headers: myHeaders });
    return this.http.get(this.stationsApiUrl+'&orderBy=!dateObserved&offset='+offset, options=options)
      .map((response: Response) => {
        return <Traffic[]> response.json();
      })
      .catch(err=>{throw new Error(err.message)});
  }

  public getJSON(): Observable<any> {
        return this.http.get("./assets/aircontrol-config.json")
                        .map((res) => res.json()).catch(err=>{throw new Error(err.message)});
    }

  generate_segment_info(sensor){
    if(sensor['location']){
      var popContent;
      if(sensor['address']){
        popContent = '<b> Traffic Information </b><br/>' +
        '<br/><table class="table">'+ '<tr><td><span class="glyphicon glyphicon-scale" aria-hidden="true"></span></td>'+'<td> '+  sensor['id']  + '</td></tr>' 
        +'<tr><td><span class="glyphicon glyphicon-home" aria-hidden="true"></span></td>'+'<td> ' + sensor['address']['streetAddress'] + ', ' + sensor['address']['addressLocality'] 
        + ', ' + sensor['address']['addressCountry'] + '</td></tr>'
        +'<tr><td><span class="glyphicon glyphicon-time" aria-hidden="true"></span></td>'+'<td> ' + this.datePipe.transform(sensor['dateObserved'],"dd-MM-yy HH:mm:ss") + '</td></tr>'+
        '<tr><td><span class="glyphicon glyphicon-road" aria-hidden="true"></span></td>'+'<td> '+sensor['averageVehicleSpeed']+' km/h </td></tr>'+
        '</table>'
        }
        
    var color = "";
    
    let intensity = sensor['occupancy']
    if (intensity >= 0 && intensity <0.4){
      color = "green"
    }
    else if (intensity >0.4 && intensity <0.6){
      color = "yellow"
    }
    else if (intensity > 0.6 && intensity < 0.8){
      color = "orange"
    }
    else if (intensity >= 0.8){
      color = "red"
    }

    var segment = new L.GeoJSON(sensor['location'],{
      style: function (feature) {
          return {color: color, opacity: 0.4};
      }
    }).bindPopup(popContent);
    this.markersMap[sensor.id] = segment;

    return segment;
    }
  }

  addToMap(sensorArray, map, trafficLayer):void {
    this.getJSON().subscribe(config => {
      var segments = [];
      for(let sensor of sensorArray){
        var segment = this.generate_segment_info(sensor)
        segments.push(segment)
        segment.addTo(trafficLayer);
      }
    }
  )};
  

  getUpdates(){
    this._mqttService.observe('trafficflow').subscribe((message:MqttMessage) => {
      var updated = <Traffic[]> JSON.parse(message.payload.toString()).data;
      console.log("--------------------UPDATED TRAFFIC-------------------\n");
      console.log(updated)
      console.log("-----------\n")
      for(let sensor of updated){
        var segment: L.GeoJSON = this.markersMap[sensor.id];

        if (segment){
          var popContent;
          if(sensor['address']){
            popContent = '<b> Traffic Information </b><br/>' +
            '<br/><table class="table">'+ '<tr><td><span class="glyphicon glyphicon-scale" aria-hidden="true"></span></td>'+'<td> '+  sensor['id']  + '</td></tr>' 
            +'<tr><td><span class="glyphicon glyphicon-home" aria-hidden="true"></span></td>'+'<td> ' + sensor['address']['streetAddress'] + ', ' + sensor['address']['addressLocality'] 
            + ', ' + sensor['address']['addressCountry'] + '</td></tr>'
            +'<tr><td><span class="glyphicon glyphicon-time" aria-hidden="true"></span></td>'+'<td> ' + this.datePipe.transform(sensor['dateObserved'],"dd-MM-yy HH:mm:ss") + '</td></tr>'+
            '<tr><td><span class="glyphicon glyphicon-road" aria-hidden="true"></span></td>'+'<td> '+sensor['averageVehicleSpeed']+' km/h </td></tr>'+
            '</table>'
          }
          
          var set_color = "";
          
          let intensity = sensor['occupancy']
          if (intensity >= 0 && intensity <0.4){
            set_color = "green"
          }
          else if (intensity >0.4 && intensity <0.6){
            set_color = "yellow"
          }
          else if (intensity > 0.6 && intensity < 0.8){
            set_color = "orange"
          }
          else if (intensity >= 0.8){
            set_color = "red"
          }
        
          segment.setStyle(function updated_style(feature) {
            return {
              opacity: 0.4,
              color: set_color,
           };
          }).bindPopup(popContent);
        }
      
    }
  });
}

  aqiI = [0 , 51 , 101 , 151 , 201 , 301 , 401 , 501];
  colors = [
    ['green','#00e400','Air quality is considered satisfactory, and air pollution poses little or no risk.',],
    ['yellow','#ffff00','Air quality is acceptable; however, for some pollutants there may be a moderate health concern for a very small number of people who are unusually sensitive to air pollution.'],
    ['orange','#ff7e00','Members of sensitive groups may experience health effects. The general public is not likely to be affected.'],
    ['red','#ff0000','Everyone may begin to experience health effects; members of sensitive groups may experience more serious health effects.'],
    ['purple','#8f3f97','Health alert: everyone may experience more serious health effects.'],
    ['brown','#7e0023','Health warnings of emergency conditions. The entire population is more likely to be affected.'],
    ['brown','#7e0023','Health warnings of emergency conditions. The entire population is more likely to be affected.']
  ];

  calculateAQI(value,type: string,arrayValues,step){
    if(value.trim() === "-")
      return -1;
    var i=arrayValues.length-1;
    while(value<arrayValues[i]){
      i--;
    }

    return (((this.aqiI[i+1]-step-this.aqiI[i])/(arrayValues[i+1]-step-arrayValues[i]))*(value-arrayValues[i]))+this.aqiI[i];
  }

  chooseColor(aqi){    
    if(aqi===-1 || aqi===Number.NEGATIVE_INFINITY){
      return ['gray','#aaaaaa','Unable to calculate AQI for this station, at least 3 parameters are needed.'];
    }
    var j=this.aqiI.length-1;
    while(aqi<this.aqiI[j]){
      j--;
    }

    return this.colors[j];
  }

  getAlerts(){
    return this._mqttService.observe('alerts');
  }

}
