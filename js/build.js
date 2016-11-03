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

    function refreshData() {
      return new Promise(function(resolve, reject){
        // GETS DATA SOURCES
        resetData();
        Fliplet.DataSources.connect(data.dataSourceId).then(function(source){
          return source.find();
        }).then(function(rows){
          // GETS ALL THE ROWS FOR A SPECIFIC COLUMN
          data.entries = [];
          rows.forEach(function(row) {
            var value = row.data[data.dataSourceColumn];
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
          // SAVES THE TOTAL NUMBER OF ROW/ENTRIES
          data.totalEntries = data.entries.length;

          return resolve();
        });
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
          getLatestData();
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
              getLatestData();
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
