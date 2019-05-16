import { IPacket, McRcon } from "../lib";

var connection = new McRcon("localhost", 25575, "P@ssW0rd23");
connection
  .on("authenticated", () => {
    console.info("Authenticated with Minecraft server");
    connection.send("say Hello");
  })
  .on("data", (data: string) => {
    console.log(`Received data: ${data}`);
  })
  .on("connect", () => {
    console.log("Connecting to server");
  })
  .on("disconnect", () => {
    console.log("Disconnected from server");
  })
  .on("error", (err: Error) => {
    console.error("Error", err);
  })
  .on("packet", (packet: IPacket) => {
    console.log(`Received packet: `, packet);
  });
connection.connect();
