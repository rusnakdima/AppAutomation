/* system libraries */
import { Injectable } from "@angular/core";
import { invoke } from "@tauri-apps/api/tauri";

@Injectable({
  providedIn: "root",
})
export class AppScriptsService {
  constructor() {}

  getListScripts() {
    return invoke("get_scripts");
  }

  getCommandsScript(nameScript: string) {
    return invoke("get_commands", { nameScript: nameScript });
  }

  createScript(exeFile: string, nameScript: string, commands: string) {
    return invoke("create_script", {
      exeFile: exeFile,
      nameScript: nameScript,
      commands: commands,
    });
  }

  deleteScript(exeFile: string, nameScript: string) {
    return invoke("delete_script", {
      exeFile: exeFile,
      nameScript: nameScript,
    });
  }

  startScript(rawHwnd: string, rawCommands: string) {
    return invoke("run_script", { rawHwnd: rawHwnd, rawCommands: rawCommands });
  }
}
