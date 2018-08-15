import {LogLevel} from '@shared/modules/logs/log.level';

export class LogEntry {
    message = '';
    level: LogLevel = LogLevel.DEBUG;
    extraInfo: any[] = [];
    logWithDate = true;

    private static formatParam(param) {
        if (typeof param === 'object') {
            return JSON.stringify(param);
        }
        return param;
    }

    buildLogString(): string {

        const stack = new Error();

        let ret = '';

        if (this.logWithDate) {
            ret += new Date().toUTCString() + ' - ';
        }
        ret += this.getFileAndLine(stack.stack) + ' - ';
        ret += LogLevel[this.level];
        ret += ' - ' + this.formatParams(this.message, this.extraInfo);

        return ret;
    }

    private formatParams(message: string, params: any[]): string {
        let index = 0;
        return message.replace(/({})/g, function(match) {
            const ret = typeof params[index] !== 'undefined' ? LogEntry.formatParam(params[index]) : LogEntry.formatParam(match);
            index += 1;
            return ret;
        });
    }

    private getFileAndLine(stack: string) {
        return stack.split('\n')[5].trim();
    }
}
