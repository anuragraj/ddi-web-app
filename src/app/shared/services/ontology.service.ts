import {Injectable} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import {BaseService} from './base.service';
import {Http} from '@angular/http';
import {AppConfig} from 'app/app.config';
import {KeyValuePair} from 'model/KeyValuePair';

@Injectable()
export class OntologyService extends BaseService {

    constructor(private http: Http, public appConfig: AppConfig) {
        super();
    }

    lookup(keys: string[]): Observable<KeyValuePair[]> {
        return this.http.get(this.appConfig.getOntologyLookupUrl(keys))
            .map(x => this.extractData<KeyValuePair[]>(x));
    }

    resolve(val: string): string {
        return 'The ' + val;
    }

}