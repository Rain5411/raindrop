import { init_events } from "./event_listeners.js";
import { World } from "./world.js";

const world = new World();
init_events(world);
world.update();
