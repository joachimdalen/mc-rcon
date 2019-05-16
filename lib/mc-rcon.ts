import * as net from "net";
import { Buffer } from "buffer";
import { EventEmitter } from "events";
import { PacketType, IPacket } from "./types";

export class McRcon extends EventEmitter {
  _host!: string;
  _port: number = 25575;
  _password!: string;
  _reqID: number = 0x0012d4a6;
  _isAuthenticated: boolean = false;
  _isConnected: boolean = false;
  _bufferData: any;
  _socket!: net.Socket;


  constructor(host: string, port: number, password: string) {
    super();
    if (!(this instanceof McRcon)) return new McRcon(host, port, password);
    this._host = host;
    this._port = port;
    this._password = password;
  }

  send(data: string, cmd?: PacketType, id?: number) {
    if (!this._isAuthenticated && this._isConnected) {
      this.emit("error", new Error("Unauthenticated"));
      return;
    }
    cmd = cmd || PacketType.COMMAND;
    id = id || this._reqID;
    this._sendRawPacket(this._encodePacket(data, cmd, id));
  }

  connect() {
    var self: McRcon = this;
    this._socket = net.createConnection(this._port, this._host);
    this._socket
      .on("data", function(data: Buffer) {
        self._onSocketData(data);
      })
      .on("connect", function() {
        self._onSocketConnect();
      })
      .on("error", function(err: Error) {
        self.emit("error", err);
      })
      .on("end", function() {
        self._onSocketDisconnect();
      });
  }
  disconnect() {
    this._socket!.end();
  }

  _encodePacket(data: string, cmd: PacketType, messageId: number): Buffer {
    var b = Buffer.alloc(14 + data.length);
    b.writeInt32LE(10 + data.length, 0);
    b.writeInt32LE(messageId, 4);
    b.writeInt32LE(cmd, 8);
    b.write(data, 12);
    b.writeInt16LE(0, 12 + data.length);
    return b;
  }

  _sendRawPacket(buffer: Buffer) {
    this._socket.write(buffer.toString("binary"), "binary");
  }

  _onSocketData(data: Buffer) {
    if (this._bufferData != null) {
      data = Buffer.concat(
        [this._bufferData, data],
        this._bufferData.length + data.length
      );
      this._bufferData = null;
    }
    while (data.length) {
      var size = data.readInt32LE(0);
      if (!size) return;

      var id = data.readInt32LE(4);
      var type = data.readInt32LE(8);
      if (size >= 10 && data.length >= size + 4) {
        if (id === -1) {
          this.emit("error", new Error("Authentication failed"));
        }
        if (!this._isAuthenticated && type == PacketType.AUTH_RES) {
          this._isAuthenticated = true;
          this._isConnected = true;
          this.emit("authenticated");
        }
        if (type == PacketType.RESPONSE) {
          var str = data.toString("utf8", 12, 12 + size - 10);
          if (str.charAt(str.length - 1) === "\n") {
            str = str.substring(0, str.length - 1);
          }
          this.emit("data", str);
          const packet: IPacket = {
            size: size,
            reqID: id,
            type: type,
            data: str
          };
          this.emit("packet", packet);
        }
        data = data.slice(12 + size - 8);
      } else {
        this._bufferData = data;
        break;
      }
    }
  }
  _onSocketConnect() {
    this.emit("connect");
    this.send(this._password, PacketType.AUTH);
  }
  _onSocketDisconnect() {
    this.emit("disconnect");
    this._isAuthenticated = false;
  }
}
