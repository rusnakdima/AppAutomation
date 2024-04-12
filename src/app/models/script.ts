import { Command } from "./command";

export interface Script {
  name: string;
  commands: Array<Command>;
}
