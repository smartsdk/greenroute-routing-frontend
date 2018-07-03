import { Injectable } from '@angular/core';
import { Http } from '@angular/http';


@Injectable()
export class Map3dService {

  constructor(private http:Http) { }

  public get3D(){
    return this.http.get('./assets/mexico-city_mexico_buildings.geojson').map(res=>res.json());
  }
}
