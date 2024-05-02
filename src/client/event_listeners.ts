import { World } from "./world.js";

interface ISunlightParameter {
  direction: [number, number, number],
  intensity: number
}

interface ILampParameter {
  lampLightIntensity: number
}

interface IRainParameter {

  numRaindrops: number,
  maxSpeed: number,
  scale: number
}

type ParameterType = ISunlightParameter & ILampParameter & IRainParameter;


interface IParameterChangedEvent {
  setter: (world: World, parameters: ParameterType) => void,
  parameters: Array<ParameterType>
};

const events = {
  "sun": {
    "setter": set_sun_parameters,
    "parameters": [
      { 
        direction: [1, 0, 0],
        intensity: 0
      } as ISunlightParameter, 
      {
        direction: [1, 0, 0],
        intensity: 0.2
      } as ISunlightParameter, 
      {
        direction: [1, 0, 0],
        intensity: 0.4
      } as ISunlightParameter, 
      {
        direction: [1, 0, 0],
        intensity: 0.6
      } as ISunlightParameter,
      {
        direction: [1, 0, 0],
        intensity: 0.8
      } as ISunlightParameter,
      {
        direction: [1, 0, 0],
        intensity: 1
      } as ISunlightParameter
    ]
  },
  "lamp": {
    "setter": set_lamp_parameters,
    "parameters": [    
      {
          lampLightIntensity: 0
      } as ILampParameter,
      {
          lampLightIntensity: 1
      } as ILampParameter,
      {
          lampLightIntensity: 2
      } as ILampParameter,
      {
          lampLightIntensity: 3
      } as ILampParameter,
      {
          lampLightIntensity: 4
      } as ILampParameter,
      {
          lampLightIntensity: 5
      } as ILampParameter
  ]
  },
  "rain": {
    "setter": set_rain_parameters,
    "parameters": [      
      {
        numRaindrops: 0,
        maxSpeed: 0,
        scale: 0
      } as IRainParameter,
      {
        numRaindrops: 1000,
        maxSpeed: 6,
        scale: 0.003
      } as IRainParameter,
      {
        numRaindrops: 2000,
        maxSpeed: 10,
        scale: 0.003
      } as IRainParameter,
      {
        numRaindrops: 3000,
        maxSpeed: 14,
        scale: 0.003
      } as IRainParameter,
      {
        numRaindrops: 4000,
        maxSpeed: 18,
        scale: 0.003
      } as IRainParameter,
      {
        numRaindrops: 5000,
        maxSpeed: 22,
        scale: 0.003
      } as IRainParameter


    ] // TODO: fill later
  },
  "water": {
    "setter": set_water_parameters,
    "parameters": [] // TODO: fill later
  }
};

export function init_events(world: World) {
  for (const event_name in events) {
    const event: IParameterChangedEvent = events[event_name];
    for (let i = 0; i < event.parameters.length; ++i) {
      const id = event_name + (i + 1).toString();
      const input = document.getElementById(id);
      if (input === undefined || input === null) {
        console.log(`input ${id} not found.`);
      }
      else {
        console.log(`register event for ${id}.`);
        input.addEventListener("click", () => {
          event.setter(world, event.parameters[i]);
        });
      }
    }
  }
}

function set_sun_parameters(world: World, parameters: ISunlightParameter) {
  console.log(`set sun parameter ${parameters}`);
  world.set_sun(parameters.direction, parameters.intensity);
}

function set_lamp_parameters(world: World, parameters: ILampParameter) {
  console.log(`set lamp parameter ${parameters}`);
  world.set_lamp(parameters.lampLightIntensity);
}

function set_rain_parameters(world: World, parameters: IRainParameter) { // TODO: set parameter
  console.log(`set rain parameter ${parameters}`);
  world.set_rain(parameters.numRaindrops, parameters.maxSpeed, parameters.scale);
}

function set_water_parameters(world: World, parameters: Object) { // TODO: set parameter
  console.log(`set water parameter ${parameters}`);
}
