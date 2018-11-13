import { BrowserModule } from '@angular/platform-browser';
import { FormsModule }   from '@angular/forms'; // <-- NgModel lives here
import { NgModule } from '@angular/core';
import { HttpModule } from '@angular/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';  // <-- #1 import module




import { LeafletModule } from '@asymmetrik/angular2-leaflet';
import { LeafletMarkerClusterModule  } from '@asymmetrik/angular2-leaflet-markercluster';



import { AppComponent } from './app.component';
import { LeafletMapComponent } from './leaflet-map/leaflet-map.component';



import {NgbModule} from '@ng-bootstrap/ng-bootstrap';

import {
  MqttMessage,
  MqttModule,
  MqttService,
  MqttServiceOptions
} from 'ngx-mqtt';

import { DatePipe } from "@angular/common";
import { ValidateCoordinatesDirective } from './directives/validate-coordinates.directive';

export const MQTT_SERVICE_OPTIONS : MqttServiceOptions = {
  hostname: 'ponte.iot.citibrain.com',
  port: 443,
  path: '/resources',
  protocol: "wss"
};


export function mqttServiceFactory() {
  return new MqttService(MQTT_SERVICE_OPTIONS);
}

// export const MQTT_SERVICE_OPTIONS = {
//   hostname: 'ponte.iot.citibrain.com',
//   port: 443,
//   path: '/resources'
// };
//
//
// export function mqttServiceFactory() {
//   return new MqttService(MQTT_SERVICE_OPTIONS);
// }

import {GrowlModule} from 'primeng/components/growl/growl';
import {AutoCompleteModule} from 'primeng/components/autocomplete/autocomplete';
import {AdvGrowlModule} from 'primeng-advanced-growl';

import { CookieService, CookieOptions } from 'angular2-cookie/core';


@NgModule({
  declarations: [
    AppComponent,
    LeafletMapComponent,
    ValidateCoordinatesDirective
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    HttpModule,
    LeafletModule,
    LeafletMarkerClusterModule,
    MqttModule.forRoot({
      provide: MqttService,
      useFactory: mqttServiceFactory
    }),
    NgbModule.forRoot(),
    GrowlModule,
    AdvGrowlModule,
    AutoCompleteModule
  ],
  providers: [
    DatePipe,
    CookieService,
    { provide: CookieOptions, useValue: {} }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
