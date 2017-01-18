function init(){
  Fliplet.Navigator.onReady().then(function(){
    $('[data-chart-column-id]').each(function (i, el) {
      var data = Fliplet.Widget.getData( $(this).data('chart-column-id') );
      var $container = $(el);
      var refreshTimeout = 5000;
      // var updateDateFormat = 'MMMM Do YYYY, h:mm:ss a';
      var updateDateFormat = 'hh:mm:ss a';

      function resetData() {
        data.entries = [];
        data.totalEntries = 0;
        data.columns = [];
        data.values = [];
      }

      function sortData() {
        var sortMethod = 'alphabetical';
        var sortOrder = 'asc';
        if (data.dataSortOrder) {
          sortMethod = data.dataSortOrder.split('_')[0];
          sortOrder = data.dataSortOrder.split('_')[1];
        }
        var objArr = [];
        for (var i = 0, l = data.columns.length; i < l; i++) {
          objArr.push({
            column: data.columns[i],
            value: (data.values[i] !== undefined ? data.values[i] : 0)
          });
        }
        switch (sortMethod) {
          case 'alphabetical':
            objArr.sort(function(a, b){
              var keyA = a.column,
                  keyB = b.column;
              // Compare the 2 dates
              if(keyA < keyB) return (sortOrder === 'asc' ? -1 : 1);
              if(keyA > keyB) return (sortOrder === 'asc' ? 1 : -1);
              return 0;
            });
            break;
          case 'timestamp':
            objArr.sort(function(a, b){
              var keyA = moment(a.column),
                  keyB = moment(b.column);
              // Compare the 2 dates
              if(keyA.isBefore(keyB)) return (sortOrder === 'asc' ? -1 : 1);
              if(keyA.isAfter(keyB)) return (sortOrder === 'asc' ? 1 : -1);
              return 0;
            });
            break;
          case 'value':
          default:
            objArr.sort(function(a, b){
              var valueA = a.value,
                  valueB = b.value;
              // Compare the 2 dates
              if(valueA < valueB) return (sortOrder === 'asc' ? -1 : 1);
              if(valueA > valueB) return (sortOrder === 'asc' ? 1 : -1);
              return 0;
            });
            break;
        }
        data.columns = [];
        data.values = [];
        for (i = 0, l = objArr.length; i < l; i++) {
          data.columns.push(objArr[i].column);
          data.values.push(objArr[i].value);
        }
      }

      function refreshData() {
        return Fliplet.DataSources.fetchWithOptions({
          dataSourceId: data.dataSourceId,
          columns: [data.dataSourceColumn]
        }).then(function(result){
          data.entries = [];
          data.columns = [];
          data.values = [];
          data.totalEntries = 0;
          if (result.dataSource.columns.indexOf(data.dataSourceColumn) < 0) {
            return Promise.resolve();
          }
          result.dataSourceEntries.forEach(function(row) {
            var value = row[data.dataSourceColumn];
            value = $.trim(value);
            data.entries.push(value);

            if (value.constructor.name === 'Array') {
              // Value is an array
              value.forEach(function(elem) {
                if ( data.columns.indexOf(elem) === -1 ) {
                  data.columns.push(elem);
                  data.values[data.columns.indexOf(elem)] = 1;
                } else {
                  data.values[data.columns.indexOf(elem)]++;
                }
              });
            } else {
              // Value is not an array
              if ( data.columns.indexOf(value) === -1 ) {
                data.columns.push(value);
                data.values[data.columns.indexOf(value)] = 1;
              } else {
                data.values[data.columns.indexOf(value)]++;
              }
            }
          });
          sortData();
          // SAVES THE TOTAL NUMBER OF ROW/ENTRIES
          data.totalEntries = data.entries.length;

          return Promise.resolve();
        });
      }

      function refreshChartInfo() {
        // Update total count
        $container.find('.total').html(data.totalEntries);
        // Update last updated time
        $container.find('.updatedAt').html(moment().format(updateDateFormat));
      }

      function refreshChart() {
        // Retrieve chart object
        var chart = $container.data('chart-column');
        // Update x-axis categories
        chart.xAxis[0].categories = data.columns;
        // Update values
        chart.series[0].setData(data.values);
        refreshChartInfo();
      }

      function getLatestData() {
        setTimeout(function(){
          refreshData().then(function(){
            refreshChart();
            if (data.auto_refresh) {
              getLatestData();
            }
          });
        }, refreshTimeout);
      }

      function drawChart() {
        var chartOpt = {
          chart: {
            type: 'column',
            renderTo: $container.find('.chart-column-container')[0],
            events: {
              load: function(){
                refreshChartInfo();
                if (data.auto_refresh) {
                  getLatestData();
                }
              }
            }
          },
          title: {
            text: ''
          },
          subtitle: {
            text: ''
          },
          xAxis: {
            categories: data.columns,
            title: {
              text: data.x_axix_title,
              enabled: (data.x_axix_title !== '' ? true : false)
            },
            crosshair: true,
            gridLineWidth: 0
          },
          yAxis: {
            min: 0,
            title: {
              text: data.y_axix_title,
              enabled: (data.y_axix_title !== '' ? true : false)
            },
            labels: {
              enabled: false
            },
            gridLineWidth: 0
          },
          tooltip: {
            enabled: !data.show_data_values,
            headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
            pointFormat: [
              '<tr><td style="color:{series.color};padding:0">{series.name}: </td>',
              '<td style="padding:0"><b>{point.y}</b></td></tr>'
            ].join(''),
            footerFormat: '</table>',
            shared: true,
            useHTML: true
          },
          plotOptions: {
            column: {
              pointPadding: 0.2,
              borderWidth: 0
            }
          },
          series: [{
            name: data.dataSourceColumn,
            data: data.values,
            color: '#3276b1',
            dataLabels: {
              enabled: data.show_data_values,
              color: '#333333',
              align: 'center',
              format: '{point.y}'
            }
          }],
          legend: {
            enabled: data.show_data_legend
          }
        };
        // Create and save chart object
        $container.data('chart-column', new Highcharts.Chart(chartOpt));
      }

      refreshData().then(drawChart);
    });
  });
}

var debounceLoad = _.debounce(init, 500);

Fliplet.Studio.onEvent(function (event) {
  if (event.detail.event === 'reload-widget-instance') {
    debounceLoad();
  }
});
init();
