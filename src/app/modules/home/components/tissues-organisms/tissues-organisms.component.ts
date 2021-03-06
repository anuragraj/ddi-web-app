import {Component, OnInit} from '@angular/core';
import * as d3 from 'd3';
import {StatisticsDomainsDetail} from 'app/model/StatisticsDomainsDetail';
import {ChartsErrorHandler} from '../charts-error-handler/charts-error-handler';
import {DataSetService} from '@shared/services/dataset.service';
import {Router} from '@angular/router';
import {AsyncInitialisedComponent} from '@shared/components/async/async.initialised.component';
import {LogService} from '@shared/modules/logs/services/log.service';

@Component({
    selector: 'app-tissues-organisms',
    templateUrl: './tissues-organisms.component.html',
    styleUrls: ['./tissues-organisms.component.css'],
    providers: [ {provide: AsyncInitialisedComponent, useExisting: TissuesOrganismsComponent }]
})
export class TissuesOrganismsComponent extends AsyncInitialisedComponent implements OnInit {

    private webServiceUrl: string;
    private retryLimitTimes: number;
    private chartsErrorHandler: ChartsErrorHandler;

    private bubChartName = 'chart_tissues_organisms';
    private field = 'Tissues';

    private tissues: StatisticsDomainsDetail[];
    private organisms: StatisticsDomainsDetail[];
    private diseases: StatisticsDomainsDetail[];

    constructor(datasetService: DataSetService, private router: Router, private logger: LogService) {
        super();
        this.webServiceUrl = datasetService.getWebServiceUrl();
        this.retryLimitTimes = 2;
        this.chartsErrorHandler = new ChartsErrorHandler();
    }

    ngOnInit() {
        this.startRequest();
    }

    private startRequest(): void {
        const self = this;
        const urls = [
            this.webServiceUrl + 'statistics/tissues?size=100',
            this.webServiceUrl + 'statistics/organisms?size=100',
            this.webServiceUrl + 'statistics/diseases?size=100'
        ];

        Promise.all(urls.map(url => d3.json(url))).then(function([tissues, organisms, diseases]) {
            self.componentLoaded();
            ChartsErrorHandler.removeGettingInfo(self.bubChartName);

            self.tissues = tissues as StatisticsDomainsDetail[];
            self.organisms = organisms as StatisticsDomainsDetail[];
            self.diseases = diseases as StatisticsDomainsDetail[];

            self.prepareData();
        }, (err) => {
            self.componentLoaded();
            ChartsErrorHandler.outputErrorInfo(self.bubChartName);
        });
    }

    private prepareData(): void {
        const self = this;

        self.tissues.pop();
        self.organisms.pop();
        self.diseases.pop();

        const totalTissues = self.tissues.shift()
            , totalOrganisms = self.organisms.shift()
            , totalDiseases = self.diseases.shift();

        self.tissues.sort((a, b) => parseInt(a.value, 10) - parseInt(b.value, 10));
        self.organisms.sort((a, b) => parseInt(a.value, 10) - parseInt(b.value, 10));
        self.diseases.sort((a, b) => parseInt(a.value, 10) - parseInt(b.value, 10));

        self.tissues = self.tissues.filter(o => parseInt(o.value, 10) >= 7);
        self.organisms = self.organisms.filter(o => parseInt(o.value, 10) >= 20);
        self.diseases = self.diseases.filter(o => parseInt(o.value, 10) >= 7);

        self.draw();
    }

    private draw(): void {
        const self = this
            , body = d3.select('#' + self.bubChartName)
            , divWidth: number = parseInt(body.style('width'), 10)
            , divHeight = 305
            , diameter = Math.min(divWidth, divHeight) / 1.15;

        body.selectAll('svg').remove();
        const svg = body.append('svg')
            .attr('width', diameter * 1.3)
            .attr('height', diameter * 1.3)
            .attr('class', 'bubble center')
            .attr('style', 'position:relative');

        d3.select(window.frameElement)
            .style('height', diameter + 'px');

        let tooltip: any = document.getElementById('tissue_organism_chart_tooltip');

        if (tooltip == null) {
            tooltip = body.append('div')
                .attr('class', 'chart_tooltip')
                .attr('id', 'tissue_organism_chart_tooltip')
                .style('opacity', 0);
        }

        self.change();
    }

    private resetRadio(divWidthTemp: number): void {
        const self = this
            , body = d3.select('#' + self.bubChartName);

        let formdiv = d3.select('#' + self.bubChartName + '_formdiv');
        if (d3.select('#' + self.bubChartName + '_formdiv').empty()) {
            formdiv = body.append('div');
        }

        formdiv
            .attr('class', 'center')
            .style('margin-bottom', '10px')
            .attr('id', self.bubChartName + '_formdiv');

        let radio_form = formdiv.select(self.bubChartName + '_radio_form');

        if (d3.select('#' + self.bubChartName + '_radio_form').empty()) {
            radio_form = formdiv.append('form');
        } else {
            return;
        }

        radio_form
            .attr('id', self.bubChartName + '_radio_form')
            .attr('class', 'center')
            .attr('style', 'width:285px;  position: absolute; left: 50%; margin-left: -142px; bottom: 10px')
            //  .attr("style","width:70%")
            .append('input')
            .attr('type', 'radio')
            .attr('name', 'dataset')
            .attr('value', 'Tissues')
            .attr('id', 'Tissues')
            .text('Tissues');
        radio_form
            .append('label')
            .text('Tissues')
            .attr('for', 'Tissues')
            .append('span')
            .append('span');
        radio_form
            .append('input')
            .attr('type', 'radio')
            .attr('name', 'dataset')
            .attr('value', 'Organisms')
            .attr('id', 'Organisms')
            .text('Organisms');
        radio_form
            .append('label')
            .text('Organisms')
            .attr('for', 'Organisms')
            .append('span')
            .append('span');
        radio_form
            .append('input')
            .attr('type', 'radio')
            .attr('name', 'dataset')
            .attr('value', 'Diseases')
            .attr('id', 'Diseases')
            .text('Diseases');
        radio_form
            .append('label')
            .text('Diseases')
            .attr('for', 'Diseases')
            .append('span')
            .append('span');

        d3.select('#' + self.bubChartName + '_radio_form')
            .select('input[value=Tissues]')
            .property('checked', true);

        d3.select('#' + self.bubChartName + '_radio_form')
            .selectAll('input')
            .on('change', function (d: any) {
                self.field = d3.select(this).attr('value');    // ignore this exception raised by editor
                self.change();
            });
    }

    private change(): void {
        const self = this
            , body = d3.select('#' + self.bubChartName)
            , div_width_inside = parseInt(body.style('width'), 10)
            , div_height_inside = parseInt(body.style('height'), 10)
            , diameter_inside = Math.min(div_height_inside, div_width_inside)
            , format = d3.format(',d')
            , color: string[] = Array.from(d3.schemeCategory10.values());

        body.selectAll('svg').remove();
        const svg_inside = body.append('svg')
            .attr('width', diameter_inside)
            .attr('height', diameter_inside)
            .attr('style', 'margin-top: 10px;')
            .attr('class', 'bubble center');
        //         .attr("style", "position:relative");

        self.resetRadio(div_width_inside);

        const value = self.field || 'Tissues';
        let data = []
            , searchWord_pre;

        if (value === 'Tissues') {
            data = self.tissues;
            searchWord_pre = 'tissue:"';
        }
        if (value === 'Organisms') {
            data = self.calculateLoggedValue(self.organisms);
            searchWord_pre = 'TAXONOMY:"';
        }
        if (value === 'Diseases') {
            data = self.diseases;
            searchWord_pre = 'disease:"';
        }

        svg_inside.selectAll('.node').remove();
        const root = d3.hierarchy(self.classes(data))
            .sum(function (d: any) {
                return d.value;
            })
            .sort((a, b) => a.value - b.value);

        const pack = d3.pack()
            .size([diameter_inside, diameter_inside - 24])
            .padding(1.5);

        const node_inside = svg_inside.selectAll('.node')
            .data(pack(root).descendants().filter(d => {
                return !d.children;
            }))
            .enter().append('g')
            .attr('class', 'node')
            .attr('transform', function (d: any) {
                return 'translate(' + d.x + ',' + d.y + ')';
            })
            .on('click', function (d: any, i) {
                d3.select('#tissue_organism_chart_tooltip')
                    .transition()
                    .duration(500)
                    .style('opacity', 0);

                let searchWord = searchWord_pre + d.data.className + '"';
                if (value === 'Organisms') {
                    searchWord = searchWord_pre + d.data.taxonomyid + '"';
                }
                self.logger.debug('Search keyword: {}', searchWord);
                self.router.navigate(['search'], {queryParams: {q: searchWord}});
                // angular.element(document.getElementById('queryCtrl')).scope().meta_search(searchWord);
                // -------------------------------  redirect --------------------------------------------
            });

        node_inside.append('circle')
            .attr('r', function (d) {
                return d.r * 1.1;
            })
            .attr('fill', function (d, i) {
                return color[i % color.length];
            });

        node_inside.append('text')
            .attr('dy', '.3em')
            .style('text-anchor', 'middle')
            .style('font-size', '10px')
            .style('fill', 'white')
            .text(function (d: any) {
                return d.r / d.data.className.length < 2.5 ? '' : d.data.className;
            });

        node_inside.on('mousemove', function (d: any) {
            const tooltip = d3.select('#tissue_organism_chart_tooltip');

            tooltip.transition()
                .duration(200)
                .style('opacity', .9);

            const mouse_coords = d3.mouse(document.getElementById('tissue_organism_chart_tooltip').parentElement);

            tooltip.html('<div><strong>' + d.data.className + ': </strong></div><div>' +
                format(d.data.value_before_log_calc) + '&nbsp;datasets</div>')
                .style('left', (mouse_coords[0] + 25) + 'px')
                .style('top', (mouse_coords[1] - 40) + 'px')
                .style('padding', '3px');
            // .style("width", d.data.className.length * 5 + d.data.value_before_log_calc.toString().length * 5 + 30 + "px");
        })
            .on('mouseout', function (d) {
                d3.select('#tissue_organism_chart_tooltip')
                    .transition()
                    .duration(200)
                    .style('opacity', 0);
            });

    }

    private calculateLoggedValue(data: StatisticsDomainsDetail[]): StatisticsDomainsDetail[] {
        const newdata = [];
        for (let i = 0; i < data.length; i++) {
            const item = {
                id: data[i].id,
                label: data[i].label,
                name: data[i].name,
                value: 1 + Math.floor(Math.log(+data[i].value)),
                value_before_log_calc: +data[i].value
            };
            newdata.push(item);
        }
        return newdata;
    }

    private classes(arr) {
        const classes = [];
        for (let i = 0; i < arr.length; i++) {
            const value_before_log_calc = arr[i].value_before_log_calc == null ? +arr[i].value : +arr[i].value_before_log_calc;
            classes.push({
                packageName: arr[i].name,
                className: arr[i].name,
                value: +arr[i].value,
                value_before_log_calc: +value_before_log_calc,
                taxonomyid: arr[i].id
            });
        }
        return {children: classes};
    }

}
