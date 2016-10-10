$('[data-poll-results-id] .poll-container').each(function () {
  var $el = $(this);

  $el.highcharts({
      chart: {
          type: 'column'
      },
      title: {
          text: 'Question label'
      },
      subtitle: {
          text: 'A subtitle can go here'
      },
      xAxis: {
          categories: [
              'Yes',
              'No',
              'Maybe'
          ],
          crosshair: true
      },
      yAxis: {
          min: 0,
          title: {
              text: 'Number of replies'
          }
      },
      tooltip: {
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
          name: 'Answers',
          data: [25, 15, 60],
          color: '#3276b1'

      }]
  });
});
