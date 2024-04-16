import { World } from "./world.js";

interface ISunlightParameter {
  direction: [number, number, number],
  intensity: number
}

interface ILampParameter {}

type ParameterType = ISunlightParameter & ILampParameter;

interface IParameterChangedEvent {
  setter: (world: World, parameters: ParameterType) => void,
  parameters: Array<ParameterType>
};

const events = {
  "time": {
    "setter": set_time_parameters,
    "parameters": [{ // TODO: update parameters
        direction: [1, 0, 0],
        intensity: 1
      } as ISunlightParameter, {
        direction: [1, 0, 0],
        intensity: 1
      } as ISunlightParameter, {
        direction: [1, 0, 0],
        intensity: 1
      } as ISunlightParameter, {
        direction: [1, 0, 0],
        intensity: 1
      } as ISunlightParameter
    ]
  },
  "lamp": {
    "setter": set_lamp_parameters,
    "parameters": [ {} ]
  },
  "rain": {
    "setter": set_rain_parameters,
    "parameters": [] // TODO: fill later
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

function set_time_parameters(world: World, parameters: ISunlightParameter) {
  console.log(`set time parameter ${parameters}`);
  world.set_sunlight(parameters.direction, parameters.intensity);
}

function set_lamp_parameters(world: World) {
  console.log(`set lamp parameter.`);
  world.switch_lamp();
}

function set_rain_parameters(world: World, parameters: Object) { // TODO: set parameter
  console.log(`set rain parameter ${parameters}`);
}

function set_water_parameters(world: World, parameters: Object) { // TODO: set parameter
  console.log(`set water parameter ${parameters}`);
}
