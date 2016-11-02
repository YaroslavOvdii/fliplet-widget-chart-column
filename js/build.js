$('[data-chart-column-id]').each(function () {
  var data = Fliplet.Widget.getData( $(this).data('chart-column-id') );
  var organizationId = Fliplet.Env.get('organizationId');
  var ignoreDataSourceTypes = ['menu']; // Ignores Menus on the data sources
  var chartLoaded = false;
  var $el = $(this).find('.chart-column-container');
  var refreshTimeout = 1000;
  data.entries = [];
  data.totalEntries = 0;
  data.columns = [];
  data.values = [];

  function requestData() {
    // GETS DATA SOURCES
    Fliplet.DataSources.connect(data.dataSourceId).then(function(source){
      return source.find();
    }).then(function(rows){
      // GETS ALL THE ROWS FOR A SPECIFIC COLUMN
      rows.forEach(function(row) {
        var value = row.data[data.dataSourceColumn];
        data.entries.push(row.data[data.dataSourceColumn]);

        if ( data.columns.indexOf(value) === -1 ) {
          data.columns.push(value);
          data.values[data.columns.indexOf(value)] = 1;
        } else {
          data.values[data.columns.indexOf(value)]++;
        }
      });
      // SAVES THE TOTAL NUMBER OF ROW/ENTRIES
      data.totalEntries = data.entries.length;

      if (!chartLoaded) {
        drawChart();
      } else {
        // Retrieve chart object
        var chart = $el.data('chartColumn');
        // @TODO: Update values
        // @TODO: Update last updated time

        setTimeout(requestData, refreshTimeout);
      }
    });
  }

  function drawChart() {
    var chart = new Highcharts.Chart({
      chart: {
        type: 'column',
        renderTo: $el[0],
        events: {
          load: function(){
            chartLoaded = true;
            setTimeout(requestData, refreshTimeout);
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
        // @TODO: THIS NEEDS TO BE UPDATED TO AN ARRAY WITH ONLY THE UNIQUE ENTRIES
        categories: data.columns,
        labels: {
          enabled: data.show_data_legend
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
        enabled: false,
        headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
        pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
          '<td style="padding:0"><b>{point.y}</b></td></tr>',
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
        name: data.x_axix_title,
        // @TODO: THIS NEEDS TO BE UPDATED TO SHOW THE TOTAL NUMBER OF EACH UNIQUE ENTRY
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
        enabled: (data.x_axix_title !== '' ? true : false)
      }
    });
    // Save chart object
    $el.data('chartColumn',chart);
  }

  requestData();
});
