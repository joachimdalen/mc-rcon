import { IPacket, McRcon, PacketType } from "../lib";

const rCon = new McRcon("localhost", 25575, "P@ssW0rd23");
var sentMessageId: number;
rCon
  .on("authenticated", () => {
    console.info("Authenticated with Minecraft server");
    sentMessageId = rCon.send("whitelist list") || -1;
    rCon.send("say Hello");
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
    
    if (packet.reqID == sentMessageId) {
      console.log("Got whitelist");
      console.log(packet.data);
    }
  });
rCon.connect();
setTimeout(() => {
  rCon.disconnect();
}, 1000 * 15);
