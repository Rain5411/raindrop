import express from "express";
import path from "path";
import http from "http";

const port: number = 5411;

class App {
  private server: http.Server;
  private port: number;

  constructor(port: number) {
    this.port = port;
    const app = express();
    app.use(express.static(path.join(__dirname, "../client")));
    app.use("/build/three.module.js", express.static(path.join(__dirname, "../../node_modules/three/build/three.module.js")));
    app.use("/jsm", express.static(path.join(__dirname, "../../node_modules/three/examples/jsm")));
    app.use("/model.glb", express.static(path.join(__dirname, "../client/model.glb")));

    this.server = new http.Server(app);
  }

  public Start() {
    this.server.listen(this.port, () => {
      console.log(`Server listening on port ${this.port}.`);
    });
  }
}

new App(port).Start();
