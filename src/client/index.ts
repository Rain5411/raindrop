import { init_events } from "./event_listeners.js";
import { World } from "./world.js";

const world = new World();

world.setup().then(() => {
  init_events(world);
  world.update();
});
