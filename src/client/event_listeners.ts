import { World } from "./world.js";

interface ISunlightParameter {
  direction: [number, number, number],
  intensity: number,
  skybox_brightness_index: number
}

interface ILampParameter {
  lampLightIntensity: number
}

interface IRainParameter {

  numRaindrops: number,
  maxSpeed: number,
  scale: number,
  splashStrength: number,
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
        direction: [0,1,0],
        intensity: 0,
        skybox_brightness_index: 0,
      } as ISunlightParameter, 
      {
        direction: [0,1,0],
        intensity: 0.2,
        skybox_brightness_index: 1,
      } as ISunlightParameter, 
      {
        direction: [0,1,0],
        intensity: 0.4,
        skybox_brightness_index: 2,
      } as ISunlightParameter, 
      {
        direction: [0,1,0],
        intensity: 0.6,
        skybox_brightness_index: 3,
      } as ISunlightParameter,
      {
        direction: [0,1,0],
        intensity: 0.8,
        skybox_brightness_index: 4,
      } as ISunlightParameter,
      {
        direction: [0,1,0],
        intensity: 1,
        skybox_brightness_index: 5,
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
        scale: 0,
        splashStrength: 0
      } as IRainParameter,
      {
        numRaindrops: 1000,
        maxSpeed: 6,
        scale: 0.005,
        splashStrength: 0.007
      } as IRainParameter,
      {
        numRaindrops: 2000,
        maxSpeed: 10,
        scale: 0.005,
        splashStrength: 0.01
      } as IRainParameter,
      {
        numRaindrops: 3000,
        maxSpeed: 14,
        scale: 0.005,
        splashStrength: 0.015
      } as IRainParameter,
      {
        numRaindrops: 4000,
        maxSpeed: 18,
        scale: 0.005,
        splashStrength: 0.02
      } as IRainParameter,
      {
        numRaindrops: 5000,
        maxSpeed: 22,
        scale: 0.005,
        splashStrength: 0.025
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
  world.set_sun(parameters.direction, parameters.intensity, parameters.skybox_brightness_index);
}

function set_lamp_parameters(world: World, parameters: ILampParameter) {
  console.log(`set lamp parameter ${parameters}`);
  world.set_lamp(parameters.lampLightIntensity);
}

function set_rain_parameters(world: World, parameters: IRainParameter) { // TODO: set parameter
  console.log(`set rain parameter ${parameters}`);
  world.set_rain(parameters.numRaindrops, parameters.maxSpeed, parameters.scale, parameters.splashStrength);
}

function set_water_parameters(world: World, parameters: Object) { // TODO: set parameter
  console.log(`set water parameter ${parameters}`);
}
