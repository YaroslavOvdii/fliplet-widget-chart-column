$('[data-poll-results-id]').each(function () {
  var data = Fliplet.Widget.getData( $(this).data('poll-results-id') );
  var organizationId = Fliplet.Env.get('organizationId');
  var ignoreDataSourceTypes = ['menu']; // Ignores Menus on the data sources

  var $el = $(this).find('.poll-container');
  data.entries = [];

  // @TODO: REFRESH SHOULD START here
  // GETS DATA SOURCES
  Fliplet.DataSources.get({
    organizationId: organizationId
  }).then(function (dataSources) {
    // FILTER DATA SOURCES TO EXCLUDE MENUS
    var filteredDataSources = dataSources.filter(function (dataSource) {
      for (var i = 0; i < ignoreDataSourceTypes.length; i++) {
        if (ignoreDataSourceTypes[i] === dataSource.type) {
          return false;
        }
      }
      return true;
    });

    // GETS THE ROWS OF THE DATA SOURCE
    Promise.all(filteredDataSources.map(function (dataSource) {
      return Fliplet.DataSources.connect(dataSource.id).then(function (source) {
        return source.find();
      }).then(function (rows) {
        dataSource.rows = rows.map(function (row) {
          return row.data;
        });
        return Promise.resolve(dataSource);
      });
    })).then(function (dataSources) {
      // GETS ALL THE ROWS FOR A SPECIFIC COLUMN
      dataSources.forEach(function (dataSource) {
        if ( dataSource.hasOwnProperty('id') && dataSource.id == data.dataSourceId ) {
          dataSource.rows.forEach(function(row) {
            data.entries.push(row[data.dataSourceColumn]);
          });
        }
      });
      // SAVES THE TOTAL NUMBER OF ROW/ENTRIES
      data.totalEntries = data.entries.length;

      // @TODO:
      // - SEARCH data.entries FOR DUPLICATES
      // - CREATE ARRAY/OBJECT THAT AGGRAGATES UNIQUE ENTRIES WITH THE NUMBER OF ROWS THAT ENTRY HAS

      drawChart();
    });
  });

  function drawChart() {
    $el.highcharts({
      chart: {
        type: 'column'
      },
        title: {
        text: '',
        enabled: false
      },
      subtitle: {
        text: '',
        enabled: false
      },
      xAxis: {
        // @TODO: THIS NEEDS TO BE UPDATED TO AN ARRAY WITH ONLY THE UNIQUE ENTRIES
        categories: data.entries,
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
        data: [25, 15, 60, 25, 15, 60],
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
  }
});
