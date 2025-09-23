import { DebugProtocol } from '@vscode/debugprotocol';
import { GDBServerController, ConfigurationArguments, createPortName } from './common';
import * as os from 'os';
import { EventEmitter } from 'events';
import { sync as commandExistsSync } from 'command-exists';

const EXECUTABLE_NAMES = ['/mnt/build/work/qemu-upstream/build/qemu-system-aarch64'];

export class QEMUServerController extends EventEmitter implements GDBServerController {
    public portsNeeded: string[] = ['gdbPort'];
    public name: 'QEMU';

    private args: ConfigurationArguments;
    private ports: { [name: string]: number };

    constructor() {
        super();
    }

    public setPorts(ports: { [name: string]: number }): void {
        this.ports = ports;
    }

    public setArguments(args: ConfigurationArguments): void {
        this.args = args;
    }

    public customRequest(command: string, response: DebugProtocol.Response, args: any): boolean {
        return false;
    }

    public initCommands(): string[] {
        const gdbport = this.ports[createPortName(this.args.targetProcessor)];

        return [
            `target-select extended-remote localhost:${gdbport}`
        ];
    }

    public launchCommands(): string[] {
        const commands: string[] = [];
        return commands;
    }

    public attachCommands(): string[] {
        const commands: string[] = [];
        return commands;
    }

    public resetCommands(): string[] {
        const commands: string[] = [
            'interpreter-exec console "monitor stop"',
            'interpreter-exec console "monitor system_reset"'
        ];

        return commands;
    }

    public swoAndRTTCommands(): string[] {
        return [];
    }

    public serverExecutable() {
        if (this.args.serverpath) {
            return this.args.serverpath;
        }
        for (const name of EXECUTABLE_NAMES) {
            if (commandExistsSync(name)) { return name; }
        }
        return 'qemu-system-arm-XXX';
    }

    public allocateRTTPorts(): Promise<void> {
        return Promise.resolve();
    }

    public serverArguments(): string[] {
        const gdbport = this.ports['gdbPort'];

        let cmdargs = [
            '-cpu', this.args.cpu,
            '-machine', this.args.machine,
            '-nographic',
            '-semihosting',
            '-gdb', 'tcp::' + gdbport.toString(),
            '-S',
            '-serial',
            'file:axis/apboot.log',
            '-device',
            'loader,file=' + this.args.executable
        ];

        if (this.args.serverArgs) {
            cmdargs = cmdargs.concat(this.args.serverArgs);
        }

        return cmdargs;
    }

    public initMatch(): RegExp {
        return null;
    }

    public serverLaunchStarted(): void {}
    public serverLaunchCompleted(): void {}
    public debuggerLaunchStarted(): void {}
    public debuggerLaunchCompleted(): void {}
}
