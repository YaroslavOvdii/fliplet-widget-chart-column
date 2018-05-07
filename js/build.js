/* eslint-disable */
(function () {
  window.ui = window.ui || {}
  ui.flipletCharts = ui.flipletCharts || {};

  function init() {
    $('[data-chart-column-id]').each(function (i, el) {
      var chartId = $(this).data('chart-column-id');
      var data = Fliplet.Widget.getData(chartId);
      var $container = $(el);
      var refreshTimeout = 5000;
      var updateDateFormat = 'hh:mm:ss a';

      function resetData() {
        data.entries = [];
        data.totalEntries = 0;
        data.columns = [];
        data.values = [];
        data.name = '';
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
            objArr.sort(function (a, b) {
              var keyA = a.column,
                  keyB = b.column;
              // Compare the 2 dates
              if(keyA < keyB) return (sortOrder === 'asc' ? -1 : 1);
              if(keyA > keyB) return (sortOrder === 'asc' ? 1 : -1);
              return 0;
            });
            break;
          case 'timestamp':
            objArr.sort(function (a, b) {
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
            objArr.sort(function (a, b) {
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
        if (!data.dataSourceQuery || !data.dataSourceId) {
          data.columns = ['A','B','C'];
          data.values = [3, 1, 2];
          data.totalEntries = 6;
          return Promise.resolve()
        }

        return Fliplet.Hooks.run('beforeQueryChart', data.dataSourceQuery)
          .then(function () {
            return Fliplet.DataSources.fetchWithOptions(data.dataSourceQuery)
          })
          .then(function (result) {
            return Fliplet.Hooks.run('afterQueryChart', result)
              .then(function () {
                data.entries = [];
                data.columns = [];
                data.values = [];
                data.totalEntries = 0;
                if (!result.dataSource.columns.length) {
                  return Promise.resolve();
                }
                switch (data.dataSourceQuery.selectedModeIdx) {
                  case 0:
                  default:
                    // Plot the data as is
                    data.name = data.dataSourceQuery.columns.value;
                    result.dataSourceEntries.forEach(function (row, i) {
                      if (!row[data.dataSourceQuery.columns.category] && !row[data.dataSourceQuery.columns.value]) {
                        return;
                      }
                      data.columns.push(row[data.dataSourceQuery.columns.category] || 'Category ' + (i+1));
                      data.values.push(parseInt(row[data.dataSourceQuery.columns.value]) || 0);
                      data.totalEntries++;
                    });
                    break;
                  case 1:
                    // Summarise data
                    data.name = 'Count of ' + data.dataSourceQuery.columns.column;
                      result.dataSourceEntries.forEach(function (row) {
                        var value = row[data.dataSourceQuery.columns.column];

                        if (Array.isArray(value)) {
                          // Value is an array
                          value.forEach(function (elem) {
                            if (typeof elem === 'string') {
                              elem = $.trim(elem);
                            }
                            data.entries.push(elem);
                            if ( data.columns.indexOf(elem) === -1 ) {
                              data.columns.push(elem);
                              data.values[data.columns.indexOf(elem)] = 1;
                            } else {
                              data.values[data.columns.indexOf(elem)]++;
                            }
                          });
                        } else {
                          // Value is not an array
                          if (typeof value === 'string') {
                            value = $.trim(value);
                          }
                          data.entries.push(value);
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
                      break;
                }

                return Promise.resolve();
              })
          })
          .catch(function (error) {
            return Promise.reject(error);
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
        var chart = ui.flipletCharts[chartId];
        // Update x-axis categories
        chart.xAxis[0].categories = data.columns;
        // Update values
        chart.series[0].setData(data.values);
        refreshChartInfo();
      }

      function getLatestData() {
        setTimeout(function () {
          refreshData().then(function () {
            refreshChart();
            if (data.autoRefresh) {
              getLatestData();
            }
          });
        }, refreshTimeout);
      }

      function drawChart() {
        var colors = [
          '#337AB7', '#5BC0DE', '#5CB85C', '#F0AD4E', '#C9302C',
          '#293954', '#2E6F82', '#3D7A3D', '#B07623', '#963732'
        ];
        colors.forEach(function eachColor (color, index) {
          if (!Fliplet.Themes) {
            return;
          }
          colors[index] = Fliplet.Themes.Current.get('chartColor'+(index+1)) || color;
        });
        var chartOpt = {
          chart: {
            type: 'column',
            zoomType: 'xy',
            renderTo: $container.find('.chart-container')[0],
            style: {
              fontFamily: (Fliplet.Themes && Fliplet.Themes.Current.get('bodyFontFamily')) || 'sans-serif'
            },
            events: {
              load: function () {
                refreshChartInfo();
                if (data.autoRefresh) {
                  getLatestData();
                }
              }
            }
          },
          colors: colors,
          title: {
            text: ''
          },
          subtitle: {
            text: ''
          },
          xAxis: {
            categories: data.columns,
            title: {
              text: data.xAxisTitle,
              enabled: data.xAxisTitle !== ''
            },
            crosshair: true,
            gridLineWidth: 0
          },
          yAxis: {
            min: 0,
            title: {
              text: data.yAxisTitle,
              enabled: data.yAxisTitle !== ''
            },
            labels: {
              enabled: false
            },
            gridLineWidth: 0
          },
          tooltip: {
            enabled: !data.showDataValues,
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
            name: data.name,
            data: data.values,
            color: '#3276b1',
            dataLabels: {
              enabled: data.showDataValues,
              color: '#333333',
              align: 'center',
              format: '{point.y}'
            },
            events: {
              click: function () {
                Fliplet.Analytics.trackEvent({
                  category: 'chart',
                  action: 'data_point_interact',
                  label: 'column'
                });
              },
              legendItemClick: function () {
                Fliplet.Analytics.trackEvent({
                  category: 'chart',
                  action: 'legend_filter',
                  label: 'column'
                });
              }
            }
          }],
          legend: {
            enabled: data.showDataLegend,
            itemStyle: {
              width: '100%'
            }
          },
          credits: {
            enabled: false
          }
        };
        // Create and save chart object
        ui.flipletCharts[chartId] = new Highcharts.Chart(chartOpt);
      }

      if (Fliplet.Env.get('interact')) {
        // TinyMCE removes <style> tags, so we've used a <script> tag instead,
        // which will be appended to <body> to apply the styles
        $($(this).find('.chart-styles').detach().html()).appendTo('body');
      } else {
        $(this).find('.chart-styles').remove();
      }

      refreshData().then(drawChart).catch(function (error) {
        console.error(error);
      });
    });
  }

  Fliplet().then(function () {
    var debounceLoad = _.debounce(init, 500, { leading: true });
    Fliplet.Studio.onEvent(function (event) {
      if (event.detail.event === 'reload-widget-instance') {
        debounceLoad();
      }
    });

    init();
  });
})();
