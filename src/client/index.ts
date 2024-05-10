import { initEvents } from "./event_listeners.js";
import { World } from "./world.js";

const world = new World();

world.setup().then(() => {
  initEvents(world);
  world.update();
});
