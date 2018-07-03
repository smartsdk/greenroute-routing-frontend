# Greenroute Frontend

## Getting Started

Clone the repository and install dependecies with ``` npm install ```. Then just do ``` ng serve ``` to run development server.

### Prerequisites
- Node package manager (npm)
- Angular CLI (ng)

## Built With

* [Angular](https://angular.io/) - The web framework used
* [Node Package Manager](https://www.npmjs.com/) - Dependency Management
* [Boostrap 3.3.7](https://getbootstrap.com/docs/3.3/) - CSS, JS framework (using CDN plus jquery's CDN)
* [NG Bootstrap](https://ng-bootstrap.github.io/#/home) - Angular version of the Angular UI Bootstrap library
* [PrimeNG](https://www.primefaces.org/primeng/#/) - UI library for Angular
* [PrimeNGAdvancedGrowl](https://github.com/kreuzerk/primeNG-advanced-growl) - Wrapper around the growl module from PrimeNG
* [Leaflet](http://leafletjs.com) - Open-source JavaScript library for mobile-friendly interactive maps
* [Leaflet.markercluster](https://github.com/Leaflet/Leaflet.markercluster) -  Beautiful Animated Marker Clustering functionality for Leaflet
* [Leaflet.contextmenu](https://github.com/aratcliffe/Leaflet.contextmenu) -  A context menu for Leaflet
* [@asymmetrik/ngx-leaflet](https://github.com/Asymmetrik/ngx-leaflet) - Leaflet packages for Angular
* [@asymmetrik/ngx-leaflet-markercluster](https://github.com/Asymmetrik/ngx-leaflet) - Extension to the @asymmetrik/ngx-leaflet package for Angular
* [ngx-mqtt](https://github.com/sclausen/ngx-mqtt) - Wrapper around MQTT.js for Angular
* [OSM Buildings](https://github.com/kekscom/osmbuildings) - JavaScript library for visualizing OpenStreetMap building geometry on interactive maps.
* [Leaflet.encoded](https://github.com/jieter/Leaflet.encoded) - Plugin to support Google's polyline encoding in Leaflet.




## Project Structure
```
routing-frontend
├── package.json
├── README.md
├── src
│   ├── app
│   │   ├── app.component.css
│   │   ├── app.component.html
│   │   ├── app.component.ts
│   │   ├── app.module.ts
│   │   ├── directives
│   │   │   └── validate-coordinates.directive.ts
│   │   ├── leaflet-map
│   │   │   ├── leaflet-map.component.css
│   │   │   ├── leaflet-map.component.html
│   │   │   └── leaflet-map.component.ts
│   │   ├── models
│   │   │   ├── air-control.ts
│   │   │   └── stop.ts
│   │   └── services
│   │            ├── air-control.service.ts
│   │           ├── map-3d.service.ts
│   │           ├── routes.service.ts
│   │           └── stops.service.ts
│   ├── assets
│   │   ├── aircontrol-config.json
│   │   ├── config.json
│   │   ├── mexico-city_mexico_buildings.geojson
│   │   └── stops-config.json
│   ├── favicon.ico
│   ├── index.html
│   └── styles.css
├── tsconfig.json
└── tslint.json
```