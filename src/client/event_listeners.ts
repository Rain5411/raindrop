import { RenderObject } from "./render/render_object.js";

interface IParameter {}

interface IParameterChangedEvent {
  setter: (parameters: IParameter) => void,
  parameters: Array<[number, IParameter]>
};

const events = {
  "time": {
    "setter": set_time_parameters,
    "parameters": []
  },
  "lamp": {
    "setter": set_lamp_parameters,
    "parameters": []
  },
  "rain": {
    "setter": set_rain_parameters,
    "parameters": []
  },
  "water": {
    "setter": set_water_parameters,
    "parameters": []
  }
};

export function init_events() {
  for (const event_name in events) {
    const event: IParameterChangedEvent = events[event_name];
    for (let i = 0; i < event.parameters.length; ++i) {
      const id = event_name + (i + 1).toString();
      const input = document.getElementById(id);
      if (input === undefined || input === null) {
        console.log(`input ${id} not found.`);
      }
      else {
        input.onclick = () => {
          event.setter(event.parameters[i]);
        };
      }
    }
  }
}

function set_time_parameters(parameters: any) { // TODO: set parameter
  console.log(`set time parameter ${parameters}`);
}

function set_lamp_parameters(parameters: any) { // TODO: set parameter
  console.log(`set lamp parameter ${parameters}`);
}

function set_rain_parameters(parameters: any) { // TODO: set parameter
  console.log(`set rain parameter ${parameters}`);
}

function set_water_parameters(parameters: any) { // TODO: set parameter
  console.log(`set water parameter ${parameters}`);
}
