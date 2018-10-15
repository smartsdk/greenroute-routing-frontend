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

import { AirControl } from '../models/air-control';
import * as L from 'leaflet';

@Injectable()
export class AirControlService {

  private selectedSensorSource = new Subject<AirControl>();
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

  private stationsApiUrl = environment.orion_url + '/v2/entities/?options=keyValues&type=AirQualityObserved&limit=100&orderBy=!dateObserved' ;

  constructor(private http: Http,private _mqttService: MqttService, private datePipe: DatePipe) { }

  getAirControl() {
    let myHeaders = new Headers(
      {
        'fiware-service': 'default',
        'fiware-servicepath': '/',
        // 'Content-Type': 'application/json',
        // 'Accept': 'application/json',        // 'Access-Control-Allow-Origin': '*'
      });

    let options = new RequestOptions({ headers: myHeaders });

    return this.http.get(this.stationsApiUrl, options=options)
      .map((response: Response) => {
        console.log(response);
        return <AirControl[]> response.json();
      })
      .catch(err=>{throw new Error(err.message)});
  }


  public getJSON(): Observable<any> {
        return this.http.get("./assets/aircontrol-config.json")
                        .map((res) => res.json()).catch(err=>{throw new Error(err.message)});
    }

  addToCluster(sensorArray ,cluster: L.MarkerClusterGroup):void {
    this.getJSON().subscribe(config => {
      for(let sensor of sensorArray){
        if(sensor['location']){
          var aqis =  [];
          var pollutants = [];
          for(var key in config){ // todos os poluentes no frontend-config.json
            if(sensor[key]){     // se existir um valor para esse poluente
              var dataObject={};
              if(sensor[key]!=="nr")
                dataObject["value"] = sensor[key];
              else
                dataObject["value"] = "-";

              dataObject["tag"] = config[key]["tag"];
              if(config[key]["tag2"]){
                dataObject["tag2"] = config[key]["tag2"];
              }
              dataObject["unit"] = config[key]["unit"];
              dataObject["name"] = config[key]["name"];

              var pollutantAQI=-1; // para a os que nao se calcula aqi terem a mesma cor que os sem valores, ie, gray
              if(config[key]["calculateAqi"]){    // se for necessario calcular o aqi
                pollutantAQI = this.calculateAQI(dataObject["value"],key,config[key]["array"],config[key]["step"]);
                if(pollutantAQI!==-1 && pollutantAQI!==Number.NEGATIVE_INFINITY)
                  dataObject["aqi"] = Math.round(pollutantAQI);

                else{
                  dataObject["aqi"] = "-";
                }

                if (isNaN(pollutantAQI))
                  pollutantAQI = -1;
                aqis.push(pollutantAQI); // deixo o -1 para fazer o maxAqi
              }


              dataObject["color"] = this.chooseColor(pollutantAQI)[1];
              pollutants.push(dataObject);
            }
            else{
               console.log("404 pollutant "+key+" not found on "+sensor.id);
            }
          }
          sensor["pollutants"] = pollutants; // array de dataObject's

          var maxAqi =  Math.max.apply( Math, aqis );
          if(maxAqi!==-1 && maxAqi!==Number.NEGATIVE_INFINITY)
            sensor["AQI"] = Math.round(maxAqi);
          else
            sensor["AQI"] = "No value";

          var maxAqiColors = this.chooseColor(maxAqi);
          sensor['health'] = maxAqiColors[2];
          var popContent;
          if(sensor['address']){
            popContent = '<b> Air Quality Station</b><br/>' +
            '<br/><table class="table">'+ '<tr><td><span class="glyphicon glyphicon-scale" aria-hidden="true"></span></td>'+'<td> '+  sensor['id']  + '</td></tr>'
            +'<tr><td><span class="glyphicon glyphicon-home" aria-hidden="true"></span></td>'+'<td> ' + sensor['address']['streetAddress'] + ', ' + sensor['address']['addressLocality']
            + ', ' + sensor['address']['addressCountry'] + '</td></tr>'
            +'<tr><td><span class="glyphicon glyphicon-time" aria-hidden="true"></span></td>'+'<td> ' + this.datePipe.transform(sensor['dateObserved'],"dd-MM-yy HH:mm:ss") + '</td></tr>'+
            '<tr><td>AQI</td><td>'+sensor['AQI']+'</td></tr>'+
            '</table>'
            }

          var marker = L.marker( [sensor['location'].coordinates[1],sensor['location'].coordinates[0]], {
            icon: this["pin_"+maxAqiColors[0]]
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

  getUpdates(){
    this._mqttService.observe('airquality').subscribe((message:MqttMessage) => {
      var updated = <AirControl[]> JSON.parse(message.payload.toString()).data;
      console.log("--------------------UPDATED AIR QUALITY-------------------\n");
      console.log(updated)
      console.log("-----------\n")
      for(let sensor of updated){
        var marker: L.Marker = this.markersMap[sensor.id];
        if(marker){
          this.getJSON().subscribe(config => {
            var aqis =  [];
            var pollutants =[]

            for(var key in config){
              if(sensor[key]){
                var dataObject={};
                if(sensor[key]!=="nr")
                  dataObject["value"] = sensor[key];
                else
                  dataObject["value"] = "-";
                dataObject["tag"] = config[key]["tag"];
                if(config[key]["tag2"]){
                  dataObject["tag2"] = config[key]["tag2"];
                }
                dataObject["unit"] = config[key]["unit"];
                dataObject["name"] = config[key]["name"];
                if(config[key]["calculateAqi"]){
                  var pollutantAQI = this.calculateAQI(dataObject["value"],key,config[key]["array"],config[key]["step"]);

                  if(pollutantAQI!==-1 && pollutantAQI!==Number.NEGATIVE_INFINITY)
                    dataObject["aqi"] = Math.round(pollutantAQI);
                  else
                    dataObject["aqi"] = "-";

                  if (isNaN(pollutantAQI))
                    pollutantAQI = -1;
                  aqis.push(pollutantAQI); // deixo o -1 para fazer o maxAqi
                  dataObject["color"] = this.chooseColor(pollutantAQI)[1];
                }
                pollutants.push(dataObject);
              }
              else{
                 console.log("404 pollutant "+key+" not found on"+sensor.id);
              }
            }

          sensor["pollutants"] = pollutants;
          var maxAqi =  Math.max.apply( Math, aqis );

          if(maxAqi!==-1 && maxAqi!==Number.NEGATIVE_INFINITY)
            sensor["AQI"] = Math.round(maxAqi);
          else
            sensor["AQI"] = "No value";

          var maxAqiColors = this.chooseColor(maxAqi);

          var popContent = '<b> Air Quality Station</b><br/>' +
          '<br/><table class="table">'+ '<tr><td><span class="glyphicon glyphicon-scale" aria-hidden="true"></span></td>'+'<td> '+  sensor['id']  + '</td></tr>'
          +'<tr><td><span class="glyphicon glyphicon-home" aria-hidden="true"></span></td>'+'<td> ' + sensor['address']['streetAddress'] + ', ' + sensor['address']['addressLocality']
          + ', ' + sensor['address']['addressCountry'] + '</td></tr>'
          +'<tr><td><span class="glyphicon glyphicon-time" aria-hidden="true"></span></td>'+'<td> ' + this.datePipe.transform(sensor['dateObserved'],"dd-MM-yy HH:mm:ss") + '</td></tr>'+
          '<tr><td>AQI</td><td>'+sensor['AQI']+'</td></tr>'+
          '</table>'

          marker.setIcon(this["pin_"+maxAqiColors[0]]).bindPopup(popContent);

        }
      );}
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
    if(value.trim === "-")
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
