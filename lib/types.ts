export interface IPacket {
  size: number;
  reqID: number;
  type: PacketType;
  data: any;
}
export enum PacketType {
  AUTH = 0x03,
  COMMAND = 0x02,
  AUTH_RES = 0x02,
  RESPONSE = 0x00,
  TIMEOUT = 2000
}
