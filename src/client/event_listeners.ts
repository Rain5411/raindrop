import { World } from "./world.js";
import { GUI } from "/addons/lil-gui.module.min.js";

interface ISunlightParameter {
  position: [number, number, number],
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

const sunParameters: ISunlightParameter[] = [
  { 
    position: [0, 0, -1],
    intensity: 0,
    skybox_brightness_index: 0,
  }, 
  {
    position: [0, 0.1, -1],
    intensity: 0.2,
    skybox_brightness_index: 1,
  }, 
  {
    position: [0, 0.3, -1],
    intensity: 0.4,
    skybox_brightness_index: 2,
  }, 
  {
    position: [0, 0.5, -1],
    intensity: 0.6,
    skybox_brightness_index: 3,
  },
  {
    position: [0, 0.6, -1],
    intensity: 0.8,
    skybox_brightness_index: 4,
  },
  {
    position: [0, 0.8, -1],
    intensity: 1,
    skybox_brightness_index: 5,
  }
];

const lampParameters: ILampParameter[] = [    
  {
    lampLightIntensity: 0
  },
  {
    lampLightIntensity: 1
  },
  {
    lampLightIntensity: 2
  },
  {
    lampLightIntensity: 3
  },
  {
    lampLightIntensity: 4
  },
  {
    lampLightIntensity: 5
  }
];

const rainParameters: IRainParameter[] = [      
  {
    numRaindrops: 0,
    maxSpeed: 0,
    scale: 0,
    splashStrength: 0
  },
  {
    numRaindrops: 1000,
    maxSpeed: 6,
    scale: 0.005,
    splashStrength: 0.007
  },
  {
    numRaindrops: 2000,
    maxSpeed: 10,
    scale: 0.005,
    splashStrength: 0.01
  },
  {
    numRaindrops: 3000,
    maxSpeed: 14,
    scale: 0.005,
    splashStrength: 0.015
  },
  {
    numRaindrops: 4000,
    maxSpeed: 18,
    scale: 0.005,
    splashStrength: 0.02
  },
  {
    numRaindrops: 5000,
    maxSpeed: 22,
    scale: 0.005,
    splashStrength: 0.025
  }
];

export function init_events(world: World) {
  const panel = new GUI( { width: 310 } );
  const folder1 = panel.addFolder("Sunlight");
	const folder2 = panel.addFolder("Lamp");
	const folder3 = panel.addFolder("Rain");

  const settings = {
    "Sunlight Brightness": 0,
    "Lamp Brightness": 2,
    "Heaviness": 2
  };

  folder1.add(settings, "Sunlight Brightness", 0, 5, 1).listen().onChange((id: number) => set_sun_parameters(world, sunParameters[id]));
  folder2.add(settings, "Lamp Brightness", 0, 5, 1).listen().onChange((id: number) => set_lamp_parameters(world, lampParameters[id]));
  folder3.add(settings, "Heaviness", 0, 4, 1).listen().onChange((id: number) => set_rain_parameters(world, rainParameters[id]));
}

function set_sun_parameters(world: World, parameters: ISunlightParameter) {
  console.log(`set sun parameter ${parameters}`);
  world.set_sun(parameters.position, parameters.intensity, parameters.skybox_brightness_index);
}

function set_lamp_parameters(world: World, parameters: ILampParameter) {
  console.log(`set lamp parameter ${parameters}`);
  world.set_lamp(parameters.lampLightIntensity);
}

function set_rain_parameters(world: World, parameters: IRainParameter) {
  console.log(`set rain parameter ${parameters}`);
  world.set_rain(parameters.numRaindrops, parameters.maxSpeed, parameters.scale, parameters.splashStrength);
}
