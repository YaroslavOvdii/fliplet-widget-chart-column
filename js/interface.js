var data = Fliplet.Widget.getData() || {
  dataSourceQuery: undefined,
  showDataLegend: undefined,
  showDataValues: undefined,
  yAxisTitle: '',
  xAxisTitle: '',
  showTotalEntries: undefined,
  autoRefresh: undefined
};

if (!data.dataSourceQuery && (data.dataSourceId || data.dataSourceColumn)) {
  // Migrate from pre-dataSourceQuery configuration
  data.dataSourceQuery = {
    dataSourceId: data.dataSourceId,
    columns: {
      column: data.dataSourceColumn
    },
    selectedModeIdx: 1
  };
}

var dsQueryData = {
  settings: {
    dataSourceLabel: 'Select a data source',
    modesDescription: 'How do you want your data to be plotted?',
    modes: [
      {
        label: 'Plot my data as it is',
        filters: false,
        columns: [
          {
            key: 'category',
            label: 'Select the column with the categories',
            type: 'single'
          },
          {
            key: 'value',
            label: 'Select the column with the values',
            type: 'single'
          }
        ]
      },
      {
        label: 'Summarise my data',
        filters: false,
        columns: [
          {
            key: 'column',
            label: 'Select a column',
            type: 'single'
          }
        ]
      }
    ]
  },
  result: data.dataSourceQuery
};

var $dataSortOrder = $('#select-data-sort-order');

var dsQueryProvider = Fliplet.Widget.open('com.fliplet.data-source-query', {
  selector: '.data-source-query',
  data: dsQueryData,
  onEvent: function (event, data) {
    if (event === 'mode-changed') {
      switch (data.value) {
        case 0:
        default:
          $('.column-sort-order').addClass('hidden');
          break;
        case 1:
          $('.column-sort-order').removeClass('hidden');
          break;
      }
      return true; // Stop propagation up to studio or parent components
    }
  }
});

dsQueryProvider.then(function(result){
  Fliplet.Widget.save({
    // dataSourceId: parseInt($dataSource.val(), 10),
    // dataSourceColumn: $dataColumns.val(),
    dataSourceQuery: result.data,
    dataSortOrder: $dataSortOrder.find(':selected').val(),
    showDataLegend: $('#show_data_legend:checked').val() === "show",
    showDataValues: $('#show_data_values:checked').val() === "show",
    yAxisTitle: $('#y_axis_title').val(),
    xAxisTitle: $('#x_axis_title').val(),
    showTotalEntries: $('#show_total_entries:checked').val() === "show",
    autoRefresh: $('#auto_refresh:checked').val() === "refresh"
  }).then(function () {
    Fliplet.Widget.complete();
    Fliplet.Studio.emit('reload-page-preview');
  });
});

// Fired from Fliplet Studio when the external save button is clicked
Fliplet.Widget.onSaveRequest(function () {
  dsQueryProvider.forwardSaveRequest();
});

// LOAD CHART SETTINGS
if (data) {
  $('#show_data_legend').prop('checked', data.showDataLegend);
  $('#show_data_values').prop('checked', data.showDataValues);
  $('#y_axis_title').val(data.yAxisTitle);
  $('#x_axis_title').val(data.xAxisTitle);
  $('#show_total_entries').prop('checked', data.showTotalEntries);
  $('#auto_refresh').prop('checked', data.autoRefresh);
  if (data.dataSourceQuery && data.dataSourceQuery.selectedModeIdx === 1) {
    $('.column-sort-order').removeClass('hidden');
  }
}
