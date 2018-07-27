import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {FacetValue} from 'model/FacetValue';
import {SearchQuery} from 'model/SearchQuery';
import {SearchService} from '@shared/services/search.service';

@Component({
    selector: 'query-builder',
    templateUrl: './query-builder.component.html',
    styleUrls: ['./query-builder.component.css']
})
export class QueryBuilderComponent implements OnInit {

    private _query: SearchQuery;

    hideBasicInfo: boolean;

    operators = [
        {name: 'AND'},
        {name: 'OR'},
        {name: 'NOT'}
    ];

    fields = [
        {name: 'all_fields', label: 'All Fields'}
        , {name: 'hello', label: 'hello world'}
    ];

    conditions = [
        {name: 'equal'}
        // { name: 'not' },
    ];

    @Input() parent: QueryBuilderComponent;
    @Input() index: number;

    @Output() queryChange = new EventEmitter<SearchQuery>();

    @Input() get query(): SearchQuery {
        return this._query;
    }

    constructor(private searchService: SearchService) {
    }

    ngOnInit() {
    }

    set query(val) {
        this._query = val;
        this.queryChange.emit(this._query);
    }



    capitalize = function capitalize(string) {
        return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
    };

    public notify() {
        this.queryChange.emit(this._query);
        if (this.parent) {
            this.parent.notify();
        }
    }

    addCondition() {
        this.hideBasicInfo = false;
        if (null == this.query.rules) {
            this.query.rules = [];
        }
        this.query.rules.push({
            condition: 'equal',
            field: 'all_fields',
            data: '',
            data2: null,
            query: null
        });
        this.notify();
    };

    removeCondition(index) {
        this.query.rules.splice(index, 1);
        this.notify();
    };

    addGroup() {
        this.hideBasicInfo = false;
        if (null == this.query.rules) {
            this.query.rules = [];
        }

        const q: SearchQuery = new SearchQuery();
        q.operator = 'AND';
        q.rules = [];

        this.query.rules.push({
            query: q,
            condition: null,
            field: null,
            data: null,
            data2: null
        });
        this.notify();
    };

    selectField(rule) {
        if (rule !== undefined) {
            if (rule.field === 'publication_date') {
                this.conditions.push({name: 'range'});
            } else if (this.conditions.length > 1) {
                this.conditions.pop();
            }
            this.clearData(rule);
        }
        this.notify();
    };

    clearData(rule) {
        rule.data = '';
        rule.data2 = '';
        this.notify();
    };

    removeGroup() {
        this.parent.removeGroupByIndex(this.index);
        this.queryChange.emit(this._query);
    };

    removeGroupByIndex(index: number) {
        this.query.rules.splice(index, 1);
        this.notify();
    }

    getFieldsData(field: string): FacetValue[] {
        return this.searchService.getAllFacetValues(field);

    }

    dropDownValueChange() {
        this.notify();
    }
}
