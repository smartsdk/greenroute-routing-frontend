import { Component, OnInit, EventEmitter, Output } from '@angular/core';
import { DatePipe } from "@angular/common";
import { Observable } from 'rxjs/Observable';


import { StopsService } from '../services/stops.service';
import { AirControlService } from '../services/air-control.service';
import { PollenService } from '../services/pollen.service';
import { WeatherService } from '../services/weather.service';
import { PoisService } from '../services/pois.service';
import { AlertService } from '../services/alert.service';
import { TrafficService } from '../services/traffic.service';
import { RoutesService } from '../services/routes.service';
import { Map3dService } from '../services/map-3d.service';

import { Stop } from '../models/stop';
import { AirControl } from '../models/air-control';
import { Pollen } from '../models/pollen';
import { Traffic } from '../models/traffic';
import { Alert } from '../models/alert';
import { Weather } from '../models/weather';
import { Pois } from '../models/pois';

import * as L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet-contextmenu';

var polyUtil = require('polyline-encoded');
var OSMB = require('osmbuildings/dist/OSMBuildings-Leaflet.js');

import {Message} from 'primeng/primeng';
import {AdvGrowlService} from 'primeng-advanced-growl';

import {AdvGrowlComponent} from 'primeng-advanced-growl/lib/messages/adv-growl.component';
import { ViewChild } from '@angular/core';

@Component({
  selector: 'app-leaflet-map',
  templateUrl: './leaflet-map.component.html',
  styleUrls: ['./leaflet-map.component.css'],
  providers: [
    StopsService,
    AirControlService,
    PollenService,
    TrafficService,
    RoutesService,
    Map3dService,
    WeatherService,
    PoisService,
    AlertService,
  ]
})


export class LeafletMapComponent implements OnInit {
  
  private from: L.Marker;
  private fromLatLng;
  private to: L.Marker;
  private toLatLng;


  private modes;
  private default_mode;
  private modes_alias;
  private colors;
  private colors_alpha;
  private active_color;
  private inactive_color;
  private alertTime;
  private timemodes = ["Leave Now","Depart at","Arrive by"];
  private default_tmode;
  private startHour = {
    hour: new Date().getHours(),
    minute: new Date().getMinutes()
  }
  private startDate;
  private polylinesObj = {};



  map: L.Map;
  private LayersControl: L.Control.Layers;

  private stopsLayer;
  private envLayer;
  private sensor: AirControl;
  private pollen_sensor: Pollen;
  private weather_sensor: Weather;
  private pois_sensor: Pois;
  private alert_sensor: Alert;
  private isClicked = false;
  private isMobile;

  baseLayers = {
      "OSM Standard Tiles" : L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png',{
        attribution : 'Map data and tiles by <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    }),
      "Carto Dark Matter" : L.tileLayer('http://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',{
        attribution : 'Map tiles by Carto/MapZen. Map data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://www.openstreetmap.org/copyright">ODbL</a>.'
    }),
      "Google" : L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
                subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
            })
  }
  

  options = {
    id: "main",
    preferCanvas: true,
    zoom: 12,
    minZoom:3,
    maxBounds: L.latLngBounds([
            [-180, -180],
            [180, 180]
        ]),
    maxBoundsViscosity: 1.0,
    zoomControl: false,
    center: L.latLng({ lat: 19.442487, lng: -99.127828 }),
    contextmenu: true,
    contextmenuWidth: 80
  };

  markerClusterGroupAir: L.MarkerClusterGroup;
  markerClusterGroupPollen: L.MarkerClusterGroup;
  markerClusterGroupWeather: L.MarkerClusterGroup;
  markerClusterGroupPois: L.MarkerClusterGroup;
  markerClusterGroupAlert: L.MarkerClusterGroup;
  markerClusterData: any[] = []; // leaflet cluster dá erro se isto não estiver aqui, nem sei para que é usado
  markerClusterOptions = {
    spiderfyOnMaxZoom: true,
    showCoverageOnHover: true,
    zoomToBoundsOnClick: true,
    disableClusteringAtZoom: 16,
    animateAddingMarkers: true,
    polygonOptions: {
      weight: 3,
      color: '#48B9C9',
    }
  };
  private msgs: Message[] = [];
  private messages = [];
  private fromText = {};
  private toText= {};
  
  private fromResults: any[];
  private toResults: any[];
  

  @ViewChild(AdvGrowlComponent)
  private growlComponent: AdvGrowlComponent;

  constructor(
    private stopService: StopsService, 
    private airControlService: AirControlService, 
    private pollenService: PollenService,
    private weatherService: WeatherService,
    private poisService: PoisService,
    private alertService: AlertService,
    private trafficService: TrafficService,
    private routesService: RoutesService, 
    private map3dService: Map3dService, 
    private datePipe: DatePipe,
    private advGrowlService: AdvGrowlService,
    ) {
  }

  onMapReady(map: L.Map) {
    this.map = map;
    this.baseLayers["Google"].addTo(map);

    this.LayersControl = L.control.layers(this.baseLayers, null,{
      position: 'bottomright'
    }).addTo(map);

    
    let toolbarButton = new toolbarButtonConstructor();
    toolbarButton.addTo(map);

    if(!this.isMobile){
      L.DomUtil.addClass(L.DomUtil.get('toolbar'),"open");
      toolbarButton._container.style.display = "none";
      this.map3dService.get3D().subscribe(res=>{
        var buildings = new OSMB.OSMBuildings().set(res).style({
          "wallColor": "rgba(173,  markerClusterGroup: L.MarkerClusterGroup; 132, 11, .1)",
          "roofColor": "rgba(243, 199, 63, .1)",
          "height": 500
        });
  
        buildings.date((new Date()));
        
        this.LayersControl.addOverlay(buildings,"3D Models");
      });
    }

    this.toolbarUtil();

    this.airControlService.getAlerts().subscribe(res=>{
      var new_alerts = JSON.parse(res.payload.toString()).data;
      for(let alert of new_alerts){
        this.handleAlerts(alert);
      }
    });

    

    new L.Control.Zoom({
      position: 'topright'
    }).addTo(map);



    map['contextmenu'].addItem({
      text: 'From here',
      callback: (e) => { this.fromHere(e, map); }
    });
    map['contextmenu'].addItem({
      text: 'To here',
      callback: (e) => { this.toHere(e, map); }
    });
    this.envLayer = L.layerGroup([]);

    this.airControlService
      .getAirControl().subscribe(result => {  
        this.airControlService.addToCluster(result, this.markerClusterGroupAir);
        this.airControlService.getUpdates();
        this.markerClusterGroupAir.addTo(this.envLayer);
        this.LayersControl.addOverlay(this.envLayer, "Air Quality, Pollen, Weather, alerts and POIs");  
      }, error => { throw new Error(error.message) }); // ou .catch, não sei :s

    var info = L.DomUtil.get('toolbar-sensor-info');
    var health = L.DomUtil.get('toolbar-sensor-health');
    this.airControlService.selectedSensor$.subscribe(s => {
      this.sensor = s;
      if (s) {
        info.style.display = 'block';
        health.style.display = 'block';
      }
      if (!s) {
        info.style.display = 'none';
        health.style.display = 'none';
      }
    });
    

    this.pollenService
      .getPollen().subscribe(result => {
        // console.log(result)
        this.pollenService.addToCluster(result, this.markerClusterGroupPollen);
  
        this.markerClusterGroupPollen.addTo(this.envLayer);
      }, error => { throw new Error(error.message) }); // ou .catch, não sei :s
      
      var pollen_info = L.DomUtil.get('toolbar-pollen-info');
      //console.log(pollen_info)
      this.pollenService.selectedSensor$.subscribe(s => {
        this.pollen_sensor = s;
        if (s) {
          //console.log("HeY")
          pollen_info.style.display = 'block';
        }
        if (!s) {
          //console.log("Bye")
          pollen_info.style.display = 'none';
        }
      });

    this.weatherService
      .getWeather().subscribe(result => {
        this.weatherService.addToCluster(result, this.markerClusterGroupWeather);
        this.weatherService.getUpdates();
        this.markerClusterGroupWeather.addTo(this.envLayer);

        this.markerClusterGroupWeather.addTo(map);
      }, error => { throw new Error(error.message) }); // ou .catch, não sei :s
      
      var weather_info = L.DomUtil.get('toolbar-weather-info');
      this.weatherService.selectedSensor$.subscribe(s => {
        this.weather_sensor = s;
        if (s) {
          weather_info.style.display = 'block';
        }
        if (!s) {
          pollen_info.style.display = 'none';
        }
      });

      this.poisService
      .getPois().subscribe(result => {
        this.poisService.addToCluster(result, this.markerClusterGroupPois);
        this.markerClusterGroupPois.addTo(this.envLayer); 
    
        // this.markerClusterGroupPois.addTo(map);
      }, error => { throw new Error(error.message) }); // ou .catch, não sei :s
      
      var pois_info = L.DomUtil.get('toolbar-pois-info');
      this.poisService.selectedSensor$.subscribe(s => {
        this.pois_sensor = s;
        if (s) {
          pois_info.style.display = 'block';
        }
        if (!s) {
          pois_info.style.display = 'none';
        }
      });

  
      this.alertService
      .getAlert().subscribe(result => {
        this.alertService.addToCluster(result, this.markerClusterGroupAlert);
        this.alertService.getUpdates();
        this.markerClusterGroupAlert.addTo(this.envLayer);

      }, error => { throw new Error(error.message) }); // ou .catch, não sei :s


      var trafficLayer = L.layerGroup([])
      let offset = 0
      let full_result;
      for (offset=0; offset<=4; offset++){
        this.trafficService
          .getTraffic(offset*1000).subscribe(result => {
            this.trafficService.addToMap(result, map, trafficLayer);
            this.trafficService.getUpdates()
          }, error => { throw new Error(error.message) });
      }
      //trafficLayer.addTo(map);
      this.LayersControl.addOverlay(trafficLayer, "Traffic data");
      
      
    this.stopService.getStops().subscribe(result => {
      this.stopsLayer = this.createStopsLayer(result, map); // não conseguia fazer esta atribuiçao no service, dava erro
      var fakeLayer = new L.LayerGroup();
      this.LayersControl.addOverlay(fakeLayer,"Public Transportation Stops");
      map.addEventListener('zoomend', (e) => {
        if(map.getZoom()<16){
          if(map.hasLayer(this.stopsLayer)){
            map.removeLayer(this.stopsLayer);
            map.addLayer(fakeLayer)
          }
          this.LayersControl.removeLayer(this.stopsLayer);
          this.LayersControl.removeLayer(fakeLayer);
          this.LayersControl.addOverlay(fakeLayer,"Public Transportation Stops");
        }else{
          if(map.hasLayer(fakeLayer)){
            map.removeLayer(fakeLayer);
            map.addLayer(this.stopsLayer)
          }
          this.LayersControl.removeLayer(fakeLayer);
          this.LayersControl.removeLayer(this.stopsLayer);
          this.LayersControl.addOverlay(this.stopsLayer,"Public Transportation Stops");
        }
      }); 
    }, error => { throw new Error(error.message) });

    map.addEventListener('click', (e) => {
    });


    this.msgs.push({severity:'info', summary:'Getting started', detail:"Right click (hold on mobile) to set directions"});
  }

  
  markerClusterReady(group: L.MarkerClusterGroup) {
    this.markerClusterGroupAir = group;
    this.markerClusterGroupPollen = group;
    this.markerClusterGroupWeather = group;
    this.markerClusterGroupPois = group;
    this.markerClusterGroupAlert = group;
  }
  
  ngOnInit(): void {
    this.default_tmode = this.timemodes[0];
    this.routesService.getConfig().subscribe(result => {
      this.modes = Object.keys(result['modes']);
      this.modes_alias = result['modes'];
      this.alertTime = result['alertTime'];
      this.default_mode = this.modes[0];
      this.colors = result['colors'];
      this.colors_alpha = result['colors_alpha'];
      this.active_color = "rgba("+result['active_color'][0]+","+result['active_color'][1]+")";
      this.inactive_color = "rgba("+result['inactive_color'][0]+","+result['inactive_color'][1]+")";
    });
    if(window.innerWidth > 768){
      this.isMobile = false;
    }else{
      this.isMobile = true;
    }  

    // weather_pollutants = this.weatherService.getUpdates();

  }

  calculate(form) {
    var e = form.value;
    var obj = {};
    obj['fromPlace'] = this.fromLatLng;
    obj['toPlace'] = this.toLatLng;
    
    obj['mode'] = this.modes_alias[e['mode']];

    
    obj['maxWalkDistance'] = e['maxWalkDistance'];
    if (e['startDate']) {
      obj['date'] = this.datePipe.transform(e['startDate'], "MM-dd-yyyy");
    } else {
      obj['date'] = this.datePipe.transform(new Date(), "MM-dd-yyyy");
    }
    if (e['startHour']) {
      obj['time'] = e['startHour'].hour+":"+e['startHour'].minute;
    } else {
      obj['time'] = new Date().getHours()+":"+new Date().getMinutes();
    }
    if(e['time-mode']==="Arrive by"){
      obj['arriveBy'] = true;
    }else{
      obj['arriveBy'] = false;  
    }

    this.routesService.calculate(obj).subscribe(result => {
      var itineraries = result['plan']['itineraries'];
      let toolbarDiv = L.DomUtil.get('toolbar-routes');
      let container = L.DomUtil.get('toolbar-routes-container');
      L.DomUtil.empty(container);
      for(let polylayer in this.polylinesObj){
        if(this.polylinesObj[polylayer]['layer']){
          this.map.removeLayer(this.polylinesObj[polylayer]['layer']);
        }
        delete this.polylinesObj[polylayer];
      }
      var j = 0;
      let itUl = L.DomUtil.create('div', 'nav nav-tabs nav-justified', container);
      itUl.id = "toolbar-itineraries-content";
      let navContent = L.DomUtil.create('div', '', container);

      var current_itinerary = 0;
      
      for (let it of itineraries) {
        let divGroup = L.DomUtil.create('li', '', itUl);
        let legsButton = L.DomUtil.create('a', 'legs-button', divGroup);
        let legsUL = L.DomUtil.create('div', 'collapse list-group', navContent);

        legsButton.id = "legs"+j;
        legsUL.id = legsButton.id+"UL";

        this.polylinesObj[legsButton.id] = {};
        this.polylinesObj[legsButton.id]['index'] = j;

        let polyArray = [];

        var k = 0;
        for (let legs of it['legs']) {
          let divGroup2 = L.DomUtil.create('div', 'inst-container', legsUL);
          let instButton = L.DomUtil.create('div', 'inst-button', divGroup2);
          let instUL = L.DomUtil.create('ul', 'collapse ', divGroup2);
          instUL.id = legsUL.id+'instUL'+k;


          instButton.id = instUL.id+"button";
          instButton.setAttribute('data-toggle','collapse');
          instButton.setAttribute('href','#'+instUL.id);
          var latlngs;
          if (legs['mode']==='Public Transportation'){
            instButton.innerHTML = "<b>"+legs['agencyId']+": </b>"+legs['routeLongName'];

            let instLiFrom = L.DomUtil.create('li', '', instUL);
            var fromDate = new Date(legs['from']['departure']);
            instLiFrom.innerHTML = "<b>From:</b> "+legs['from']['name'] + " at "+ fromDate.getHours() + ":" + (fromDate.getMinutes()<10?'0':'') + fromDate.getMinutes();
            instLiFrom.style.textAlign = 'justify';
            
            var toDate = new Date(legs['to']['arrival']);
            let instLiTo = L.DomUtil.create('li', '', instUL);
            instLiTo.innerHTML = "<b>To:</b> "+legs['to']['name'] + " at "+ toDate.getHours() + ":" + (toDate.getMinutes()<10?'0':'') + toDate.getMinutes();
            instLiTo.style.textAlign = 'justify';
            
            latlngs = polyUtil.decode(legs['legGeometry']['points']);
          }
          else{
            instButton.innerHTML = '<b>'+legs['mode']+'</b> '+ Math.round(legs['distance'])+ ' m ('+Math.ceil(legs['distance']/.5 * 0.006)+' min)' ;
            for (let i of legs['instructions']) {
              let instLi = L.DomUtil.create('li', '', instUL);
              instLi.innerHTML = i;
              instLi.style.textAlign = 'justify';
            }
            latlngs = polyUtil.decode(legs['route']);
          }
          if(latlngs){
            var polyline = L.polyline(latlngs, { 
              color: '#9fa1a5',
              weight: 8
           });
            polyline.addEventListener('mouseover',()=>{
              if(L.DomUtil.hasClass(legsUL,'in')){
                if (!L.DomUtil.hasClass(instUL, 'in')) {
                  instButton.style.backgroundColor = "rgba("+this.colors[this.polylinesObj[legsButton.id]['index']]+","+this.colors_alpha+")"; //'#0afffa'
                  this.polylinesObj[legsButton.id][instButton.id].setStyle({color: "rgba("+this.colors[this.polylinesObj[legsButton.id]['index']]+","+this.colors_alpha+")"});
                }
              }else{
                for(let poly in this.polylinesObj[legsButton.id]){
                  if(poly.startsWith('legs')){
                    this.polylinesObj[legsButton.id][poly].setStyle({color: "rgba("+this.colors[this.polylinesObj[legsButton.id]['index']]+","+this.colors_alpha+")"});
                  }
                }
              }
            });

            polyline.addEventListener('mouseout',()=>{
              if(!L.DomUtil.hasClass(legsUL,'in')){
                for(let poly in this.polylinesObj[legsButton.id]){
                  if(poly.startsWith('legs')){
                    instButton.style.backgroundColor = '#FFFFFF'; // cinzento
                    this.polylinesObj[legsButton.id][poly].setStyle({color:this.inactive_color});
                  }
                }
              }
              else{
                if (!L.DomUtil.hasClass(instUL, 'in')) {
                  instButton.style.backgroundColor = '#FFFFFF'; // azul
                  this.polylinesObj[legsButton.id][instButton.id].setStyle({color:this.active_color});
                }else{
                  instButton.style.backgroundColor = "rgba("+this.colors[this.polylinesObj[legsButton.id]['index']]+","+this.colors_alpha+")";
                  this.polylinesObj[legsButton.id][instButton.id].setStyle({color:"rgba("+this.colors[this.polylinesObj[legsButton.id]['index']]+","+this.colors_alpha+")"})
                }
              } 
            });

            polyline.addEventListener('click',()=>{
              legsButton.click();
            });
            
            polyArray.push(polyline);

            this.polylinesObj[legsButton.id][instButton.id] = polyline;

            instButton.addEventListener('click', () => {
              if (L.DomUtil.hasClass(instUL, 'in')) {
                instButton.style.backgroundColor = '#FFFFFF'; // #5091cd
                this.polylinesObj[legsButton.id][instButton.id].setStyle({color:this.active_color});
              }
              else {
                instButton.style.backgroundColor = "rgba("+this.colors[this.polylinesObj[legsButton.id]['index']]+","+this.colors_alpha+")";
                this.polylinesObj[legsButton.id][instButton.id].setStyle({color:"rgba("+this.colors[this.polylinesObj[legsButton.id]['index']]+","+this.colors_alpha+")"});
              }
            });
          }
          k++;
        }

        legsButton.innerHTML = 'Itinerary ' + (j+1);
        legsButton.setAttribute('itinerary', j.toString())
        
        this.polylinesObj[legsButton.id]['layer'] = L.layerGroup(polyArray);
        this.map.addLayer(this.polylinesObj[legsButton.id]['layer']);

        legsButton.addEventListener('click', () => {
          current_itinerary = parseInt(legsButton.getAttribute('itinerary'));

          var _content = L.DomUtil.get('toolbar-itineraries-content');
          for(var _j=0;_j<_content.children.length;_j++){         
            var _legs = L.DomUtil.get(_content.children[_j].children[0].id);
            var _legsUL = L.DomUtil.get(_legs.id+"UL");
            if(_legs.id!==legsButton.id){ // fechar as outras legs que estejam abertas 
              L.DomUtil.removeClass(_legs.parentElement,"active");
              if(L.DomUtil.hasClass(_legsUL, 'in')){
                for(var _i=0;_i<_legsUL.children.length;_i++){ 
                  var _legsULinstUL = L.DomUtil.get(_legsUL.children[_i].children[1].id);
                  var _legsULinstULbutton = L.DomUtil.get(_legsUL.children[_i].children[0].id); 
                  if(L.DomUtil.hasClass(_legsULinstUL,"in")){  //fechar os filhos das legs se estiverem abertos
                    _legsULinstULbutton.style.backgroundColor = '#FFFFFF'; // #5091cd
                    L.DomUtil.removeClass(_legsULinstUL,"in");
                  }
                  this.polylinesObj[_legs.id][_legsULinstULbutton.id].setStyle({color:this.inactive_color});  //meter a polyline a cinzento No matter what
                }
                L.DomUtil.removeClass(_legsUL,"in"); //finnaly close legsUL
              }
            }else {
              L.DomUtil.addClass(_legs.parentElement,"active");
              if(!L.DomUtil.hasClass(_legsUL, 'in')){
                for(var _i=0;_i<_legsUL.children.length;_i++){
                  var _legsULinstULbutton = L.DomUtil.get(_legsUL.children[_i].children[0].id); 
                  this.polylinesObj[_legs.id][_legsULinstULbutton.id].setStyle({color:this.active_color});  //meter a polyline a azul
                  this.polylinesObj[_legs.id][_legsULinstULbutton.id].bringToFront();
                }
                L.DomUtil.addClass(_legsUL,"in");
              }
            }
          }
        });
        j++;
      }
      let divSaveButton = L.DomUtil.create('div', '', navContent);
      divSaveButton.id = "save-route-div";
      
      let saveRouteButton = L.DomUtil.create('a', 'btn btn-default btn-sm', divSaveButton);
      saveRouteButton.id = "save-route-button"
      saveRouteButton.innerHTML = "Save Itinerary"

      saveRouteButton.addEventListener('click',()=>{
        let fromPlace = result['plan']['fromPlace'];
        let toPlace = result['plan']['toPlace'];
        let arriveBy = result['requestParameters']['arriveBy'];
        let wheelchair = result['requestParameters']['wheelchair'];
        let segments = itineraries[current_itinerary]['legs'];
        
        let data = {
          "wheelchair": wheelchair,
          "arriveBy": arriveBy,
          "toPlace": toPlace,
          "fromPlace": fromPlace,
          "segments": segments
        }
        
        let save_result = null;

        this.routesService.saveRoute(data)
        .then(response => {
          if (response.ok) {
            console.log('Itinerary saved: Status ', response.status)
            this.advGrowlService.createSuccessMessage('Itinerary saved with success', '');
          }
          else {
            console.log('Saving itinerary error: Status ', response.status)
            this.advGrowlService.createErrorMessage('It was not possible to save the itinerary', '');
          }
        })
        .catch(error => {
          console.log('Saving itinerary error: ' + error.message)
          this.advGrowlService.createErrorMessage('It was not possible to save the itinerary', '');
        })
      });

      toolbarDiv.style.display = 'block'; 
      L.DomUtil.addClass(L.DomUtil.get('legs0UL'),'in');  // abrir a tab da primeira polyline na toolbar
      L.DomUtil.addClass(L.DomUtil.get('legs0').parentElement,'active');  // abrir a tab da primeira polyline na toolbar
      

      for(let poly in this.polylinesObj['legs0']){
        if(poly.startsWith('legs')){
          this.polylinesObj['legs0'][poly].setStyle({color:this.active_color});
          this.polylinesObj['legs0'][poly].bringToFront();
        }
      }
      this.map.fitBounds(L.latLngBounds(this.fromLatLng,this.toLatLng));
      if(this.map.hasLayer(this.stopsLayer)){
        this.map.removeLayer(this.stopsLayer);
      }


    }, err => {
      err+=""
      var index = this.growlComponent.messages.findIndex(message => message.detail === err);
      if(index>=0){
        this.growlComponent.removeMessage(this.growlComponent.messages[index].id);
      }
      this.advGrowlService.createErrorMessage(err,'Something went wrong!');
    });

  }


  fromMarker() {
    if (!this.from) {
      this.from = L.marker(this.fromLatLng, {
        draggable: true,
        icon: L.icon({
          iconUrl: "../assets/marker-start.png",
          iconSize:     [35, 55], // size of the icon
          iconAnchor:   [17.5, 55], // point of the icon which will correspond to marker's location
          popupAnchor:  [0, -55] // point from which the popup should open relatixe to the iconAnchor
        })
      }).addTo(this.map).addEventListener('moveend', (e) => {
        
        this.routesService.searchLocationReverse([
          e.target['_latlng']['lat'], 
          e.target['_latlng']['lng']
        ].toString()).subscribe(data=>{
          if(!data.error){
            this.fromText = {
              display_name: data.display_name
            }
            this.fromChange([
              e.target['_latlng']['lat'], 
              e.target['_latlng']['lng']
            ].toString())
          }else{
            this.fromLatLng = [
              e.target['_latlng']['lat'], 
              e.target['_latlng']['lng']
            ];
            this.fromText = {
              display_name: this.fromLatLng.toString()
            }
          }

        });
      });
    }
    else {
      var aux;
      if(this.fromText){
        aux = this.fromText['display_name'];
      }
      this.from.setLatLng(this.fromLatLng);
      if(aux){
        this.fromText= {
          display_name: aux
        }
      }      
    }
  }

  toMarker() {
    if (!this.to) {
      this.to = L.marker(this.toLatLng, {
        draggable: true,
        icon: L.icon({
          iconUrl: "../assets/marker-end.png",
          iconSize:     [35, 55], // size of the icon
          iconAnchor:   [17.5, 55], // point of the icon which will correspond to marker's location
          popupAnchor:  [0, -55] // point from which the popup should open relatixe to the iconAnchor
        })
      }).addTo(this.map).addEventListener('moveend', (e) => {
        
        this.routesService.searchLocationReverse([
          e.target['_latlng']['lat'], 
          e.target['_latlng']['lng']
        ].toString()).subscribe(data=>{
          if(!data.error){
            this.toText = {
              display_name: data.display_name
            }
            this.toChange([
              e.target['_latlng']['lat'], 
              e.target['_latlng']['lng']
            ].toString())
          }else{
            this.toLatLng = [
              e.target['_latlng']['lat'], 
              e.target['_latlng']['lng']
            ];
            this.toText = {
              display_name: this.toLatLng.toString()
            }
          }
        });
      });
    }
    else {
      var aux;
      if(this.toText){
        aux = this.toText['display_name'];
      }
      this.to.setLatLng(this.toLatLng);
      if(aux){
        this.toText['display_name'] = aux;
      }      
    }
  }


  fromChange(e) {
    let e_split = e.split(',');
    this.fromLatLng = [
      e_split[0],
      e_split[1]
    ];
    this.fromMarker();

  }

  toChange(e) {
    let e_split = e.split(',');
    this.toLatLng = [
      e_split[0],
      e_split[1]
    ];
    this.toMarker();
  }


  fromHere(event, map: L.Map) {
    this.routesService.searchLocationReverse([
      event['latlng']['lat'], 
      event['latlng']['lng']
    ].toString()).subscribe(data=>{
      if(!data.error){
        this.fromText = {
          display_name: data.display_name
        }
        this.fromChange([
          event['latlng']['lat'], 
          event['latlng']['lng']
        ].toString())
      }else{
        this.fromLatLng = [
          event['latlng']['lat'], 
          event['latlng']['lng']
        ] 
        this.fromText = {
          display_name: this.fromLatLng.toString()
        }
        this.fromMarker();
      }
      
    });
  }


  toHere(event, map: L.Map) {
    this.routesService.searchLocationReverse([
      event['latlng']['lat'], 
      event['latlng']['lng']
    ].toString()).subscribe(data=>{
      if(!data.error){
        this.toText = {
          display_name: data.display_name
        }
        this.toChange([
          event['latlng']['lat'], 
          event['latlng']['lng']
        ].toString())
      }else{
        this.toLatLng = [
          event['latlng']['lat'], 
          event['latlng']['lng']
        ] 
        this.toText = {
          display_name: this.toLatLng.toString()
        }
        this.toMarker();
      }
      
    });
  }


  toolbarUtil() {
    let button = L.DomUtil.get('toolbar-button');
    let buttonControl = L.DomUtil.get('toolbarButtonControl');
    let toolbar = L.DomUtil.get('toolbar');

    L.DomEvent.disableClickPropagation(button);
    L.DomEvent.disableClickPropagation(toolbar);
    L.DomEvent.disableScrollPropagation(toolbar);
    L.DomEvent.on(toolbar, 'contextmenu', function (ev) {
        L.DomEvent.stopPropagation(ev);
    });

    button.addEventListener("click", () => {
      if (L.DomUtil.hasClass(toolbar, "open")) {
        L.DomUtil.removeClass(toolbar, "open");
        // button.style.display = "none";

        setTimeout(() => {buttonControl.style.display = "block";},300) 
      }
    });    
  }


  createStopsLayer(stopsArray: Stop[], map:L.Map):L.LayerGroup {
    var auxArray=[];
    for(let stop of stopsArray){
      var marker = L.circleMarker([ stop.lat, stop.lon ],{
        weight: 1,
        color: '#000000',
        opacity: 1,
        fillColor: "#ffffff",
        fillOpacity: 1,
        radius: 3
      });

      marker.on({
        contextmenu: ()=>{/*do nothing instead of browser context menu*/ },
        click: ()=>{
        this.stopService.getJSON().subscribe(config=>{
          this.stopService.getStop(stop.id.toString()).subscribe((result)=>{
            var popContent = '<b>'+ stop.name+'</b><ul>';
            for(var key in config){
              if(result[key]!==undefined){
                popContent+="<li>"+config[key][result[key]]+"</li>";
              }
            }
            popContent+="</ul><div class='row'><div class='col-xs-8 col-xs-offset-2'>";
            popContent+="<button class='btn btn-default' id='marker-button-from-"+stop.id+"'"+">From Here</button>";
            popContent+="<button class='btn btn-default' id='marker-button-to-"+stop.id+"'"+">To Here</button>";
            popContent+="</div></div>";
            var popup = L.popup({
                offset:[0,0]
              }).setLatLng([stop.lat,stop.lon]).setContent(popContent).openOn(map);
            var buttomFrom = L.DomUtil.get('marker-button-from-'+stop.id);
            buttomFrom.addEventListener('click',()=>{
                this.fromHere({
                  'latlng': {
                    'lat': stop.lat,
                    'lng':stop.lon
                  }
                },map);
                map.closePopup();
              })
            var buttomTo = L.DomUtil.get('marker-button-to-'+stop.id);
            buttomTo.addEventListener('click',()=>{
                this.toHere({
                  'latlng': {
                    'lat': stop.lat,
                    'lng':stop.lon
                  }
                },map);
                map.closePopup();
              })
          });
        });
        },
      });
      auxArray.push(marker);
    }
    return L.layerGroup(auxArray);
  }



  handleAlerts(alert){
    var now = new Date().getTime();
    var _alertTime = new Date(alert['dateTime']).getTime();
    var diff = Math.abs(_alertTime - now);
    if( diff < this.alertTime ){
      // https://stackoverflow.com/questions/4149276/javascript-camelcase-to-regular-form
      // var alertType = alert.alertSource.replace(/([A-Z])/g, ' $1')
      // .replace(/^./, str => { return str.toUpperCase(); });
      // var eventObserved = alert.dateObserved.replace(/([A-Z])/g, ' $1')
      // .replace(/^./, str => { return str.toUpperCase(); });

      if (alert.severity == 'critical' || alert.severity == 'high'){
        this.advGrowlService.createErrorMessage(alert.subCategory.replace(/\b\w/g, l => l.toUpperCase()) + " " +alert.category.replace(/\b\w/g, l => l.toUpperCase()) + " Alert", alert.alertSource,{
          id: alert.id,
          location: alert.location,
          dateTime: alert.dateTime
        });
      }

      else if (alert.severity == 'medium') {
        this.advGrowlService.createWarningMessage(alert.subCategory.replace(/\b\w/g, l => l.toUpperCase()) + " " +alert.category.replace(/\b\w/g, l => l.toUpperCase()) + " Alert", alert.alertSource,{
          id: alert.id,
          location: alert.location,
          dateTime: alert.dateTime
        });
      }
      else {
        this.advGrowlService.createSuccessMessage(alert.subCategory.replace(/\b\w/g, l => l.toUpperCase()) + " " +alert.category.replace(/\b\w/g, l => l.toUpperCase()) + " Alert", alert.alertSource,{
          id: alert.id,
          location: alert.location,
          dateTime: alert.dateTime
        });
      }
  }
}
  
  showData(pollutant){
    var div = L.DomUtil.get('toolbar-sensor-data');
    div.innerHTML = '<h4> ' +pollutant.name + ' | '+pollutant.value +" "+ pollutant.unit+' </h4>';
  }

  onMessages(messages){
    this.messages = messages;
  }

  closeEvent(event){
    console.log('close',event);
  }
  clickEvent(event){
    if(event.additionalProperties){
      if(event.additionalProperties.location){// geo:point e geo:line
        if(event.additionalProperties.location.geometry==="point"){
          var alertLatLng = event.additionalProperties.location.coords;
          // var alertMarker = L.marker(L.latLng(alertLatLng[1],alertLatLng[0]), {
          //   icon: L.icon({
          //     iconUrl: 'assets/marker-icon.png', 
          //     iconSize: [ 25, 41 ],
          //     iconAnchor: [ 13, 0 ]
          //   })
          // }).addTo(this.map);
          // setTimeout(() => {
          //   alertMarker.remove();
          // }, 3000);
          this.map.panTo(L.latLng(alertLatLng[0][0],alertLatLng[0][1])); 
        }
      }
    }
  }

  search(event,func){
    var regex = new RegExp(/^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?),\s*[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/)
    var areCoords = regex.test(event.query)
    if(func === 'from'){
      if(areCoords){
        this.fromText = {
          display_name: event.query
        }
        this.fromChange(event.query);
        this.routesService.searchLocationReverse(event.query).subscribe(data=>{
          data['latlng'] = event.query;
          this.fromResults = [data];
        });
      }
      else{
        this.routesService.searchLocation(event.query).subscribe(data=>{
          this.fromResults = data;
        });
      }
    }else{
      if(areCoords){
        this.toText = {
          display_name: event.query
        }
        this.toChange(event.query);
        this.routesService.searchLocationReverse(event.query).subscribe(data=>{
          data['latlng'] = event.query;
          this.toResults = [data];
        });
      }else{
        this.routesService.searchLocation(event.query).subscribe(data=>{
          this.toResults = data;
        });
      }
      
    }
    
  }

  select(event,func){
    if(func === 'from'){
      this.fromText = {
        display_name: event.display_name
      }
      if(event['latlng'])
        this.fromChange(event['latlng'])
      else
        this.fromChange([event.lat,event.lon].toString())
    }
    else{
      this.toText = {
        display_name: event.display_name
      }
      if(event['latlng'])
        this.toChange(event['latlng'])
      else
        this.toChange([event.lat,event.lon].toString())
    }
  }

}



var toolbarButtonConstructor = L.Control.extend({
    options: {
       // topright, topleft, bottomleft, bottomright
      position: 'topleft'
    },
    onAdd(map){
      let toolbar = L.DomUtil.get('toolbar');
      var container = L.DomUtil.create('div',
        'leaflet-bar leaflet-control ',
        toolbar);
      container.id = "toolbarButtonControl"

      L.DomEvent.on(container, 'click',this._fireClick,this);

      L.DomEvent.disableClickPropagation(container);

      return container;

    },
    onRemove(map){
      return this;
      
    },
    _fireClick(e){
      let toolbar = L.DomUtil.get('toolbar');
      let button = L.DomUtil.get('toolbar-button');
      if(!L.DomUtil.hasClass(toolbar,"open")){
        L.DomUtil.addClass(toolbar,"open");
        button.style.display = "block";
        this._container.style.display = "none";
      }
      
    }
  });