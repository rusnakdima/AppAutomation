export interface KeyData {
  type: string;
  key: string;
}

export interface Command {
  link_field: number;
  type: "keyboard" | "mouse" | "time";
  key: Array<KeyData>;
  button: "left" | "right" | "middle" | "scrollUp" | "scrollDown" | "scrollLeft" | "scrollRight";
  type_press: "click" | "down" | "up" | "move";
  move_dir: "x" | "y";
  move_amount: number;
  type_duration: "min" | "sec" | "ms";
  duration: number;
}
