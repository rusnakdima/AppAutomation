/* system libraries */
import { CommonModule, Location } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import * as uuid from 'uuid';
import { Subject } from 'rxjs';

/* material */
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';

/* models */
import { KeyData, Command } from '@models/command';

/* services */
import { AppScriptsService } from '@services/app-scripts.service';

/* components */
import { INotify, WindowNotifyComponent } from '@views/shared/window-notify/window-notify.component';

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

  listScripts: Array<string> = [];
  listKeys: Array<string> = [];
  listNumKeys: Array<string> = [];
  listAnotherKeys: Array<string> = ["Space", "Esc", "Ctrl", "Shift", "Alt", "Enter", "Tab", "Delete", "Home", "PageUp", "PageDown", "End"];
  listFnKeys: Array<string> = ["F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12"];

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
      const elem = this.listScripts.find((script: string) => script === value);
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
    this.appScriptsService.getListScripts()
    .then((data: any) => {
      if (data && data != '') {
        const parseData: {[key: string]: any} = JSON.parse(data);
        Object.values(parseData).forEach((app_scrips: Array<string>) => {
          app_scrips.forEach((script: string) => {
            this.listScripts.push(script);
          })
        });
      }
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

  getFieldGroupById(id: string, field: string) {
    const index = this.commands.controls.findIndex(c => c.value.id === id);
    if (this.commands.at(index)) {
      return (this.commands.at(index) as FormGroup).get(field);
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

  getKeysById(id: string) {
    const dataKeys: Array<KeyData> = this.getFieldGroupById(id, 'key')?.value;
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
    const id = this.getFieldGroup(index, 'link_field')?.value;
    if (id) {
      const dataTypePress = this.getFieldGroupById(id, 'type_press')?.value;
      if (dataTypePress == "down") {
        return this.getKeysById(id);
      } else {
        this.removeCommand(index);
      }
    }
    return 'N/A';
  }

  setDisableField(index: number, field: string) {
    if (this.getFieldGroup(index, 'type_press')?.value == "up") {
      this.getFieldGroup(index, field)?.disable();
      // console.log(this.commands.value)
      return true;
    }
    return false;
  }

  setValue(index: number, field: string, event: any) {
    const id = this.getFieldGroup(index, 'id')?.value;
    if (id && (
      (field == 'type' && event != 'time') ||
      (field == 'button') ||
      (field == 'type_press' && event == 'down')
    )) {
      const indexGroup = this.commands.controls.findIndex(c => c.value.link_field === id);
      this.getFieldGroup(indexGroup, field)?.setValue(event);
    } else {
      this.getFieldGroup(index, 'type_press')?.setValue('click');
      const indexGroup = this.commands.controls.findIndex(c => c.value.link_field === id);
      if (indexGroup > -1) {
        this.removeCommand(indexGroup);
      }
    }
  }

  addCommand(index: number) {
    const command = this.fb.group({
      id: [uuid.v4()],
      link_field: [''],
      type: ['keyboard', Validators.required],
      key: [[{ type: 'letter', key: 'A' }]],
      type_press: ['click'],
      button: ['left'],
      move_dir: ['x'],
      move_amount: [0],
      type_duration: ['sec'],
      duration: [0]
    });

    this.commands.insert(index, command);
  }

  addCommandKeyUp(index: number, event: any) {
    if (event.value == "down") {
      this.addCommand(index+1);
      const commandDown = this.getGroupCommandsByIndex(index);
      let command = this.getGroupCommandsByIndex(index+1);
      command.setValue(commandDown.value);
      command.controls['id'].setValue(uuid.v4());
      command.controls['link_field'].setValue(commandDown.controls['id'].value);
      command.controls['type_press'].setValue('up');
    }
  }

  insertFromData(command: Command) {
    const commandGroup = this.fb.group({
      id: [command.id],
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

    this.commands.controls.forEach((control: any) => {
      Object.keys(control.controls).forEach((field: any) => {
        if (control.controls[field].disabled) {
          control.controls[field].enable();
        }
      })
    });

    if (this.scriptForm.valid) {
      this.nameScript = this.f['name'].value;
      this.appScriptsService.createScript(this.exeFile, this.f['name'].value, JSON.stringify(this.commands.value))
      .then((data: any) => {
        this.dataNotify.next({status: 'success', text: data});
        this.location.back();
      })
      .catch((err: any) => {
        console.error(err);
        this.dataNotify.next({ status: 'error', text: 'Error!' });
      });
    }
  }
}
