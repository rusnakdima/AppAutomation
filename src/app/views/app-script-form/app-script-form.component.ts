/* system libraries */
import { CommonModule, Location } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';

/* material */
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';

/* models */
import { KeyData, Command } from '@models/command';
import { Script } from '@models/script';

/* components */
import { INotify, WindowNotifyComponent } from '@views/shared/window-notify/window-notify.component';
import { AppScriptsService } from '@services/app-scripts.service';

@Component({
  selector: 'app-app-script-form',
  standalone: true,
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA
  ],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatInputModule, MatFormFieldModule, MatSelectModule, MatMenuModule, WindowNotifyComponent],
  templateUrl: './app-script-form.component.html'
})
export class AppScriptFormComponent {
  title: string = '';

  constructor(
    private appScriptsService: AppScriptsService,
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private location: Location
  ) {
    this.scriptForm = fb.group({
      name: ['', [Validators.required, this.isExistName()]],
      commands: fb.array([])
    });
  }

  scriptForm: FormGroup;

  dataNotify: Subject<INotify> = new Subject();

  exeFile: string = '';
  nameScript: string = '';

  listScripts: Array<Script> = [];
  listKeys: Array<string> = [];
  listNumKeys: Array<string> = [];
  listAnotherKeys: Array<string> = ["Space", "Esc", "Ctrl", "Shift", "Alt", "Enter", "Tab", "Delete", "Home", "PageUp", "PageDown", "End"];

  isGetCommands: boolean = true;

  ngOnInit() {
    for (let charCode = 97; charCode <= 122; charCode++) {
      let letter = String.fromCharCode(charCode);
      this.listKeys.push(letter.toUpperCase());
    }
    for (let i = 0; i <= 9; i++) {
      this.listNumKeys.push(i.toString());
    }

    this.route.queryParams.subscribe((params: any) => {
      const data = JSON.parse(params['data']);
      this.exeFile = data['exeFile'];
      this.nameScript = (data['nameScript'] != '') ? data['nameScript'] : 'Untitled';
      this.f['name'].setValue(this.nameScript);
    });
    setTimeout(() => {
      this.getCommands();
      this.getNameScripts();
    }, 500);
  }

  get f() { return this.scriptForm.controls; }

  isExistName(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      const elem = this.listScripts.find((script: Script) => script.name === value);
      if (elem) {
        return { isExist: true };
      }
      return null;
    }
  }

  getCommands() {
    this.appScriptsService.getCommandsScript(this.nameScript)
    .then((data: any) => {
      this.isGetCommands = false;
      const parseData = JSON.parse(data);
      if (parseData["commands"]) {
        const parseCommands = JSON.parse(parseData['commands']);
        if (Array.isArray(parseCommands)) {
          parseCommands.forEach((command: Command) => {
            this.insertFromData(command);
          })
        }
      }
    })
    .catch((err: any) => {
      console.error(err);
      this.dataNotify.next({status: 'error', text: err});
    })
  }

  getNameScripts() {
    this.appScriptsService.getListScripts(this.exeFile)
    .then((data: any) => {
      const parseData: Array<string> = JSON.parse(data);
      parseData.forEach((value: string) => {
        const obj = {
          name: value,
          commands: []
        }
        this.listScripts.push(obj);
      });
    })
    .catch((err: any) => {
      console.error(err);
      this.dataNotify.next({status: 'error', text: err});
    });
  }

  get commands() {
    return this.scriptForm.get('commands') as FormArray;
  }

  getGroupCommandsByIndex(index: number) {
    return this.commands.controls[index] as FormGroup;
  }

  getFieldGroup(indexGroup: number, field: string) {
    if (this.commands.at(indexGroup)) {
      return (this.commands.at(indexGroup) as FormGroup).get(field);
    }
    return;
  }

  setKey(index: number, value: string, type: string) {
    let dataKeys: Array<KeyData> = this.getFieldGroup(index, 'key')?.value;
    if (Array.isArray(dataKeys)) {
      const dataKey = dataKeys.findIndex((key: KeyData) => key.key === value);
      if (dataKey == -1) {
        dataKeys.push({type: type, key: value});
      } else {
        dataKeys.splice(dataKey, 1);
      }
    }
  }

  checkChooseKeyBut(index: number, keyBut: string): boolean {
    const dataKeys: Array<KeyData> = this.getFieldGroup(index, 'key')?.value;
    if (Array.isArray(dataKeys)) {
      return dataKeys.some((key: KeyData) => key.key == keyBut);
    }
    return false;
  }

  getKeys(index: number) {
    const dataKeys: Array<KeyData> = this.getFieldGroup(index, 'key')?.value;
    let listKeys: Array<string> = [];
    let rawString: string = '';
    if (Array.isArray(dataKeys)) {
      dataKeys.forEach((key: KeyData) => {
        listKeys.push(key.key);
      });
      rawString = listKeys.join(', ');
    }
    return rawString;
  }

  getKeyUpByDown(index: number) {
    const indexDown = this.getFieldGroup(index, 'link_field')?.value;
    if (indexDown != null) {
      const dataKeys = this.getFieldGroup(indexDown, 'key')?.value;
      const dataTypePress = this.getFieldGroup(indexDown, 'type_press')?.value;
      if (Array.isArray(dataKeys) && dataTypePress == "down") {
        return this.getKeys(indexDown);
      } else {
        this.removeCommand(index);
      }
    }
    return 'N/A';
  }

  addCommand(index: number, indexKeyD: number, type: string, type_press: string = 'click') {
    const listKeys = (type_press == 'up') ? this.getFieldGroup(indexKeyD, 'key')?.value : [{ type: 'letter', key: 'A' }];
    const command = this.fb.group({
      link_field: [indexKeyD],
      type: [type, Validators.required],
      key: [listKeys],
      type_press: [type_press],
      button: ['left'],
      move_dir: ['x'],
      move_amount: [0],
      type_duration: ['sec'],
      duration: [0]
    });

    this.commands.insert(index, command);
  }

  addCommandKeyUp(index: number, type: string, event: any) {
    if (event.value == "down") {
      this.addCommand(index+1, index, type, 'up');
    }
  }

  insertFromData(command: Command) {
    const commandGroup = this.fb.group({
      link_field: [command.link_field],
      type: [command.type, Validators.required],
      key: [command.key],
      type_press: [command.type_press],
      button: [command.button],
      move_dir: [command.move_dir],
      move_amount: [command.move_amount],
      type_duration: [command.type_duration],
      duration: [command.duration]
    });
    this.commands.push(commandGroup);
  }

  removeCommand(index: number) {
    this.commands.removeAt(index);
  }

  cancel() {
    this.location.back();
  }
  
  save() {
    if (this.commands.controls.length == 0) {
      this.dataNotify.next({ status: 'warning', text: 'You must have at least one command.' });
      return;
    }

    if (this.scriptForm.invalid) {
      Object.values(this.scriptForm.controls).forEach(control => {
        control.markAsTouched();
      });
    }

    if (this.scriptForm.valid) {
      this.nameScript = this.f['name'].value;
      this.appScriptsService.createScript(this.exeFile, this.f['name'].value, JSON.stringify(this.commands.value))
      .then((data: any) => {
        this.dataNotify.next({status: 'success', text: data});
      })
      .catch((err: any) => {
        console.error(err);
        this.dataNotify.next({ status: 'error', text: 'Error!' });
      });
    }
  }
}
