import { Component, OnInit, EventEmitter, Output,Input,SimpleChanges,OnChanges } from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import * as d3 from 'd3';
import { ChartsErrorHandler } from '../../charts-error-handler/charts-error-handler';


import { Observable } from 'rxjs';
import {NotificationsService} from "angular2-notifications/dist";
import {DatasetCount} from "../../../model/DatasetCount";
import {DataSetDetail} from "../../../model/DataSetDetail";
import {DataSetService} from "../../../services/dataset.service";
import {AppConfig} from "../../../app.config";
import {ProfileService} from "../../../services/profile.service";
import {ThorService} from "../../../services/thor.service";

@Component({
  selector: 'app-dashboard-views-count-profile',
  templateUrl: './dashboard-views-count-profile.component.html',
  styleUrls: ['./dashboard-views-count-profile.component.css']
})
export class DashboardViewsCountProfileComponent implements OnInit {

    @Output()
    notifyHomeLoader:EventEmitter<string> = new EventEmitter<string>();
    private username: string;
    private web_service_url = this.appConfig.getWebServiceUrl();
    private retryLimitTimes = 2;
    private userServiceUrl: string;
    private dataOfViewCount: DatasetCount;

    @Input() datasets: DataSetDetail[] = [];


    constructor( private dataSetService: DataSetService,private route: ActivatedRoute,private appConfig: AppConfig,private profileService: ProfileService


        , private router: Router
        , private notificationService: NotificationsService
        , private thorService: ThorService) {
        this.userServiceUrl = dataSetService.getProfileServiceUrl();
    }

    ngOnInit() {
        //this.profileService.getDataSetDetails(this.profileService.profile);
        this.profileService.onProfileReceived.subscribe(x => this.reloadDataSets());



        // Listen page size
        Observable.fromEvent(window, 'resize')
            .debounceTime(100) //timer
            .subscribe((event) => {
                // restartRequest
                this.reloadDataSets();
            });

        this.web_service_url = this.dataSetService.getWebServiceUrl();
    }

    dataSets: DataSetDetail[];

    ngOnChanges(changes: SimpleChanges) {
        for (let propName in changes) {
            let chng = changes[propName];
            let cur  = JSON.stringify(chng.currentValue);
            let prev = JSON.stringify(chng.previousValue);
            //console.log(`${propName}: currentValue = ${cur}, previousValue = ${prev}`);
            if(propName=="datasets"){
                this.datasets = chng.currentValue;
                if(null!=chng.currentValue){
                    this.reloadDataSets();
                }
            }
        }
    }

    reloadDataSets(){
        this.startRequest(this.datasets);
    }

    private startRequest(datasetDetail: DataSetDetail[] ) {

        let processedData = this.prepareData(datasetDetail);
        console.log(processedData);
        this.draw(processedData);
    }
    private draw(processedData : any){

        this.drawGraph(processedData);
        let self = this;
        d3.select(window)
            .on('resize.annual_omicstype', function() {
                if(self.router.url === "/home")
                    self.drawGraph(processedData)
            })
    }

    private drawGraph(processedData : any): void {
        let self = this;

        let body = d3.select('#barchart_views_dashboard');
        let svgProperties: any = this.initSvg(body);

        let width = svgProperties.get("width");
        let height = svgProperties.get("height");
        let heightOffset = svgProperties.get("heightOffset");
        let svg = svgProperties.get("svg");
        let toolTip = svgProperties.get("toolTip");

        let annualDataExtends = processedData.get("annualDataExtends");
        let allYear = processedData.get("allYear");
        let genomicsList = processedData.get("genomicsList");
        let transcriList = processedData.get("transcriList");
        let metaboloList = processedData.get("metaboloList");
        let proteomiList = processedData.get("proteomiList");
        let omicsTypes = [{omicstype:'genomicsList'},{omicstype:'transcriList'},{omicstype:'metaboloList'},{omicstype:'proteomiList'}];

        let yearSet = processedData.get("yearSet");

        let dataCollection: number[] = [];
        let yearCollections: number[] = [];
        let countCollections: number[] = [];
        allYear.forEach(data=>{
            let count: number = Number(data['value']);
            dataCollection.push(count);
            yearCollections.push(data['year']);
        });
        let x0 = d3.scaleTime().range([0, width - 30]);
        let y0 = d3.scaleLinear().range([height - heightOffset, 0]);
        let y1 = d3.scaleLinear().range([height - heightOffset, 0]);
        let xAxis = d3.axisBottom(x0).ticks(yearSet.size+2);
        let yAxisLeft = d3.axisLeft(y0).ticks(2);
        let yAxisRight = d3.axisRight(y1).ticks(2);
        let yLine = d3.scaleLinear().range([15, 0]);
        let yNavLine = d3.axisBottom(yLine).ticks(0);


        let minpointer = processedData.get("minYear");
        let max_G_T = processedData.get("max_G_T");
        let max_M_P = processedData.get("max_M_P");

        x0.domain([new Date(Number(minpointer)-1,0,0), new Date()]);

        y0.domain([0, Number(max_G_T)]);
        y1.domain([0, Number(max_M_P)]);


        var valueline = d3.line()
            .x(d => {

                return x0(new Date(d["year"], 0, 0));
            })
            .y(d => {

                return y0(parseInt(d["value"]));
            });

        var valueline2 = d3.line()
            .x(d => {
                // console.log('Line:');
                // console.log(x0(new Date(d["year"], 0, 0)));
                return x0(new Date(d["year"], 0, 0));
            })
            .y(d => {
                // console.log(y1(parseInt(d["value"])));
                return y1(parseInt(d["value"]));
            });

        if(genomicsList){
        svg.append("path")
            .style("stroke", "steelblue")
            .attr("d", valueline(genomicsList));
        }
        if(transcriList){
        svg.append("path")
            .style("stroke", "steelblue")
            .style("stroke-dasharray", ("3, 3"))
            .attr("d", valueline(transcriList));
        }
        if(metaboloList){
        svg.append("path")        // Add the valueline2 path.
            .attr("class", "line")
            .style("stroke", "red")
            .attr("d", valueline2(metaboloList));
    }
        if(proteomiList){
        svg.append("path")
            .attr("class", "line")
            .style("stroke", "red")
            .style("stroke-dasharray", ("3, 3"))
            .attr("d", valueline2(proteomiList));
        }
        svg.selectAll("path")
            .style('stroke-width', '2')
            .style('fill', 'none');

        svg.selectAll("circle")
            .data(allYear)
            .enter()
            .append("circle")
            .attr("cx", function (d, i) {
                return x0(new Date(d["year"], 0, 0));
            })
            .attr("cy", function (d) {
                console.log(d);
                if (d['omics_type'] == "Genomics" || d['omics_type'] == "Transcriptomics") {
                    console.log(y0(d['value']));
                    return y0(d['value']);
                } else if (d['omics_type'] == "Metabolomics" || d['omics_type'] == "Proteomics") {
                    console.log(y1(d['value']));
                    return y1(d['value']);
                }
            })
            .attr("fill", function (d) {
                if (d['omics_type'] == "Genomics" || d['omics_type'] == "Transcriptomics") {
                    console.log(y0(d['value']));
                    return "steelblue";
                } else if (d['omics_type'] == "Metabolomics" || d['omics_type'] == "Proteomics") {
                    console.log(y1(d['value']));
                    return "red";
                }
            });

        svg.selectAll("circle")
            .attr("r", 4)
            .style("cursor", "pointer")
            .on("mouseover", function (d: any, i: number) {
                let mouse_coords = d3.mouse(document.getElementById("bar_chart_tooltip").parentElement);
                // console.log(mouse_coords[0]+','+mouse_coords[1]);
                /*
                for d3 tooltip
                if a tooltip is inside angular component inside a div like this
                ----div-----
                [component]
                [component]
                [component]
                ----div-----
                the tooltip will show at the div,not the component ,so we have to fix it
                 */
                let profile_div = d3.select('#profile_div').style('height');
                let profile_div_height = profile_div.substring(0,profile_div.indexOf('px'));

                let barchart_omicstype_annual_dashboard = d3.select('#barchart_claim_dashboard').style('height');
                let barchart_claim_dashboard_height = barchart_omicstype_annual_dashboard.substring(0,barchart_omicstype_annual_dashboard.indexOf('px'));

                //barchart_citations_dashboard height
                let barchart_citations_dashboard = d3.select('#barchart_citations_dashboard').style('height');
                let barchart_citations_dashboard_height = barchart_citations_dashboard.substring(0,barchart_citations_dashboard.indexOf('px'));
                //barchart_connections_dashboard
                let barchart_connections_dashboard = d3.select('#barchart_connections_dashboard').style('height');
                let barchart_connections_dashboard_height = barchart_connections_dashboard.substring(0,barchart_connections_dashboard.indexOf('px'));
                //barchart_views_dashboard
                let barchart_views_dashboard = d3.select('#barchart_views_dashboard').style('height');
                let barchart_views_dashboard_height = barchart_views_dashboard.substring(0,barchart_views_dashboard.indexOf('px'));
                //barchart_reanalisys_dashboard
                let barchart_reanalisys_dashboard = d3.select('#barchart_reanalisys_dashboard').style('height');
                let barchart_reanalisys_dashboard_height = barchart_reanalisys_dashboard.substring(0,barchart_reanalisys_dashboard.indexOf('px'));

                let position = Number(profile_div_height) - Number(barchart_claim_dashboard_height)-Number(barchart_citations_dashboard_height)-Number(barchart_connections_dashboard_height)-Number(barchart_views_dashboard_height)-Number(barchart_reanalisys_dashboard_height) + mouse_coords[1] - 40;
                // console.log('position:'+position);

                toolTip.html(d.omics_type.toString() + ": <br>" + d.value.toString() + " datasets")
                    .style("left", ((mouse_coords[0] + 5) + "px"))
                    .style("top", (position + "px"))
                    .style("height", "3em")
                    .style("width", ((d.year.toString().length + 9) * 8 + "px"))
                    .style("padding", "5px");

                toolTip.transition()
                    .duration(200)
                    .style("opacity", .9);

            })
            .on("mouseout", function () {
                toolTip.transition()
                    .duration(500)
                    .style("opacity", 0);
            })
            .on("click", function (d) {
                toolTip.transition()
                    .duration(500)
                    .style("opacity", 0);

                let searchWord = "*:* AND omics_type:\""
                    + DashboardViewsCountProfileComponent.getName(d["year"], d["value"], annualDataExtends)
                    + "\" AND publication_date:\"" + d["year"] + "\"";

                // console.log("router.navigate>>");
                self.router.navigate(['search'],{ queryParams: { q: searchWord }});
            });

        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + (height - heightOffset) + ")")
            .call(xAxis);

        svg.append("g")
            .attr("class", "y axis")
            .style("stroke", "steelblue")
            .call(yAxisLeft);

        svg.append("g")
            .attr("class", "y axis")
            .style("stroke", "red")
            .attr("transform", "translate(" + (width - 30) + " ,0)")
            .call(yAxisRight);
        // let legend = svg.selectAll(".legend")
        //     .data(omicsTypes.slice().reverse())
        //     .enter().append("g")
        //     .attr("class", "legend")
        //     .attr("transform", function (d, i) {
        //         return "translate(" + (i * 0) + ",200)";
        //     })
        //     .on("click", function (d) {
        //         var searchWord = "*:* AND omics_type:\"" + d + "\"";
        //         // angular.element(document.getElementById('queryCtrl')).scope().meta_search(searchWord);//***not yet solved**/
        //         // console.log("this.router.navigate");
        //         self.router.navigate(['search'],{ queryParams: { q: searchWord }});
        //     });
        //
        // let legend_coords = {
        //     "genomics": { x: -15, y: 25, color: "steelblue" },
        //     "transcriptomics": { x: -15, y: 45, color: "steelblue" },
        //     "metabolomics": { x: (width + 10) / 2, y: 25, color: "red" },
        //     "proteomics": { x: (width + 10) / 2, y: 45, color: "red" }
        // };
        //
        // legend.append("path")
        //     .attr("class", "omics-line")
        //     .style("stroke-width", "2")
        //     .attr("d", d => {
        //         return "M " + legend_coords[d]["x"] + " " + (legend_coords[d]["y"] + 8) +
        //             " L " + (legend_coords[d]["x"] + 14) + " " + (legend_coords[d]["y"] + 8);
        //     })
        //     .style("stroke", d => {
        //         return legend_coords[d]["color"];
        //     })
        //     .style("stroke-dasharray", d => {
        //         if (d === "transcriptomics" || d === "proteomics") {
        //             return ("3, 3");
        //         } else {
        //             return ("0, 0");
        //         }
        //     });
        //
        // legend.append("text")
        //     .attr("x", d => {
        //         return legend_coords[d]['x'] + 20
        //     })
        //     .attr("y", d => {
        //         return legend_coords[d]['y']
        //     })
        //     .attr("dy", ".85em")
        //     .style("text-anchor", "start")
        //     .text(d => {
        //         return (d.substr(0, 1).toUpperCase() + d.substr(1, d.length - 1));
        //     });


    }
    private initSvg(body : any): any {

        let svgProperties = new Map<string, any>();
        // let body = d3.select('#barchart_omicstype_annual');
        let divWidthPx = body.style("width");
        let divWidth = parseInt(divWidthPx.substr(0, divWidthPx.length - 2));
        let latestDatasetsDivHeightPx = d3.select('#barchart_views_dashboard').style('height');
        let divHeight = parseInt(latestDatasetsDivHeightPx.substr(0, latestDatasetsDivHeightPx.length - 2));
        divHeight = 100;
        divWidth = parseInt(body.style("width"));

        let heightOffset = 50;
        let margin = { top: 20, right: 0, bottom: -20, left: 20 },
            width = divWidth - margin.left - margin.right,
            height = divHeight - margin.top - margin.bottom;
        body.attr("position", "relative");

        let tool_tip = null;
        if (!tool_tip) {
            // tool_tip = document.getElementById('barchart_omicstype_annual_dashboard_svg')
            tool_tip = body.append("div")
                .attr("id", "bar_chart_tooltip")
                .attr("class", "chart_tooltip")
                .style("opacity", 0)
                .attr("position", "absolute");
        }

        d3.select("#barchart_views_dashboard_svg").remove();
        let svg = d3.select("#barchart_views_dashboard").append("svg")
            .attr("id", "barchart_views_dashboard_svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + 20 + "," + margin.top + ")");

        svgProperties.set("width", width);
        svgProperties.set("height", height);
        svgProperties.set("heightOffset", heightOffset);
        svgProperties.set("svg", svg);
        svgProperties.set("toolTip", tool_tip);

        return svgProperties;
    }
    private prepareData(annualData: any[]): any {
        let years: number[] = [];
        annualData.forEach(d=>{
            let date = d['dates']['publication'];
            let year;
            if(date.toString().indexOf('-')>=0){
                year = date.toString().substr(0,4);
            }else{
                year = date.toString().substr(date.toString().lastIndexOf(' '),4);
            }
            years.push(Number(year));
        })
        let maxYear = Math.max(...years);
        console.log(maxYear);
        let minYear = Math.min(...years);
        let allList = [];
        let allList_g = [];
        let allList_m = [];
        let allList_p = [];
        let allList_t = [];
        for(let i = minYear;i<maxYear+1;i++){
            allList_g.push({
                year: +i,
                value: 0
            })
            allList_m.push({
                year: +i,
                value: 0
            })
            allList_p.push({
                year: +i,
                value: 0
            })
            allList_t.push({
                year: +i,
                value: 0
            })
        }


        let genomicsList = [],
            metaboloList = [],
            proteomiList = [],
            transcriList = [],
            allYearData = [];
        annualData.forEach(d=>{
            // console.log(d);
            let date = d['dates']['publication'];
            let year;
            if(date.toString().indexOf('-')>=0){
                year = date.toString().substr(0,4);
            }else{
                year = date.toString().substr(date.toString().lastIndexOf(' '),4);
            }
            switch (d['omics_type'].toString()) {
                case "Genomics":

                    genomicsList.push({
                        year: +year,
                        value: +d['scores']['viewCount']
                    });
                    break;
                case "Transcriptomics":

                    transcriList.push({
                        year: +year,
                        value: +d['scores']['viewCount']
                    });
                    break;
                case "Metabolomics":

                    metaboloList.push({
                        year: +year,
                        value: +d['scores']['viewCount']
                    });
                    break;
                case "Proteomics":

                    proteomiList.push({
                        year: +year,
                        value: +d['scores']['viewCount']
                    });
                    break;
                default:
                    break;
            }
        })

        let processedData = new Map<string, any>();

        let genomics = this.groupByYear(genomicsList);
        let transcri = this.groupByYear(transcriList);
        let metabolo = this.groupByYear(metaboloList);
        let proteomi = this.groupByYear(proteomiList);

        console.log(genomics);
        console.log(transcri);
        console.log(metabolo);
        console.log(proteomi);


        allList_g.forEach(g=>{
            if(genomics)
                genomics.forEach(d=>{
                    if(g['year']==d['year']){
                        g['value']=d['value'];
                    }
                })
        })

        allList_t.forEach(g=>{
            if(transcri)
                transcri.forEach(d=>{
                    if(g['year']==d['year']){
                        g['value']=d['value'];
                    }
                })
        })
        allList_m.forEach(g=>{
            if(metabolo)
                metabolo.forEach(d=>{
                    if(g['year']==d['year']){
                        g['value']=d['value'];
                    }
                })
        })
        allList_p.forEach(g=>{
            if(proteomi)
                proteomi.forEach(d=>{
                    if(g['year']==d['year']){
                        g['value']=d['value'];
                    }
                })
        })

        let allFullYearData = [];
        let data_M_P = [];
        let data_G_T = [];

        if(allList_g)
            allList_g.forEach(d=>{
                allFullYearData.push({
                    omics_type:'Genomics',year:d['year'],value:d['value']
                });
                data_G_T.push(Number(d['value']));
            })
        if(allList_t)
            allList_t.forEach(d=>{
                allFullYearData.push({
                    omics_type:'Transcriptomics',year:d['year'],value:d['value']
                });
                data_G_T.push(Number(d['value']));
            })
        if(allList_m)
            allList_m.forEach(d=>{
                allFullYearData.push({
                    omics_type:'Metabolomics',year:d['year'],value:d['value']
                });
                data_M_P.push(Number(d['value']));
            })
        if(allList_p)
            allList_p.forEach(d=>{
                allFullYearData.push({
                    omics_type:'Proteomics',year:d['year'],value:d['value']
                });
                data_M_P.push(Number(d['value']));
            })

        let dataCollection = [];
        let yearSet = new Set();
        allFullYearData.forEach(data=>{
            yearSet.add(data['year']);
        });
        let max_G_T = Math.max(...data_G_T);
        let max_M_P = Math.max(...data_M_P);



        if(allList_g)
            allList_g.forEach(d=>{
                if(d['value']!=0)
                allYearData.push({
                    omics_type:'Genomics',year:d['year'],value:d['value']
                });
            })
        if(allList_t)
            allList_t.forEach(d=>{
                if(d['value']!=0)
                allYearData.push({
                    omics_type:'Transcriptomics',year:d['year'],value:d['value']
                });
            })
        if(allList_m)
            allList_m.forEach(d=>{
                if(d['value']!=0)
                allYearData.push({
                    omics_type:'Metabolomics',year:d['year'],value:d['value']
                });
            })
        if(allList_p)
            allList_p.forEach(d=>{
                if(d['value']!=0)
                allYearData.push({
                    omics_type:'Proteomics',year:d['year'],value:d['value']
                });
            })



        processedData.set("allYear", allYearData);
        processedData.set("genomicsList", allList_g);
        processedData.set("transcriList", allList_t);
        processedData.set("metaboloList", allList_m);
        processedData.set("proteomiList", allList_p);
        processedData.set("minYear", minYear);
        processedData.set("max_G_T", max_G_T);
        processedData.set("max_M_P", max_M_P);
        processedData.set("yearSet",yearSet);

        return processedData;

    }
    private prepareAllDate(priData: any, nameString: string, allYearData: any[]) {
        for (var i = 0; i < priData.length; i++) {
            allYearData.push({
                name: nameString,
                year: priData[i].year,
                value: priData[i].value
            })
        }
    }

    private static getName(year: any, value: any, data: any[]): string{
        for (var i = 0; i < data.length; i++) {
            for (var j = 0; j < data[i].omics.length; j++) {
                if (data[i].omics[j].year == year && data[i].omics[j].value == value) {
                    return data[i].omics[j].name;
                }
            }
        }
    }

    private groupByYear(data : any){
        if(data.length<=0){
            return;
        }
        let yearSet = new Set();
        data.forEach(d=>{
            yearSet.add(d['year']);
        })
        let groupedByYear = [];
        let years = Array.from(yearSet);
        years.forEach(y=>{
            let totalCount = 0;
            data.forEach(d=>{
                if(Number(d['year']) == Number(y)){
                    totalCount = totalCount + Number(d['value']);
                }
            })
            groupedByYear.push({
                value: totalCount,year:Number(y)
            })
        })
        return groupedByYear;

    }

}