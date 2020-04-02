$(document).ready(function () {
  var sheetID;
  var sheetName;
  var pageLength = 15;
  var queryArray = [""];
  var columnBreakpoints = ["meddesktop", "tabletp", "mobilel", "mobilep"];
  const urlParams = new URLSearchParams(window.location.search);

  // Check if a custom sheet query is provided
  if (urlParams.get("sheet")) {
    sheetID = urlParams.get("sheet");
  } else {
    sheetID = "19PBIps8-1k4jEjEv8iRH6DQp1IsVZlYCBwninqSxYNg";
  };

  // Check if a custom worksheet query is provided
  if (urlParams.get("page")) {
    sheetName = urlParams.get("page");
  } else {
    sheetName = "Sheet1";
  };

  // If a length query is given, show that many entries per page
  if (urlParams.get("length")) {
    // Ensure that the provided value is string
    if (!(isNaN(urlParams.get("length")))) {
      pageLength = parseInt(urlParams.get("length"));
    }
  };

  Tabletop.init({
      key: sheetID
    })
    .then(function (data, tabletop) {
      columnNames = data[sheetName].columnNames;

      var sheetData = data[sheetName].elements;
      var columnObj = [{
        "orderable": false,
        "data": null,
        "defaultContent": ''
      }];
      var columnDefs = [{
        "width": "5%",
        "targets": 0
      }];

      // Here we separate the data column wise to feed to DataTable
      for (var i = 0; i < columnNames.length; i++) {
        columnObj.push({
          "mDataProp": columnNames[i]
        });

        // The first five columns are given fixed width
        if (i < 5) {
          columnDefs.push({
            "width": "20%",
            "targets": i
          });
        };

        // Add responsive breakpoints to the first four columns
        // And add "none" class to the remaining columns so that they don't show
        if (columnBreakpoints.length > 0) {
          $("#firstRow").append('<th class="' + columnBreakpoints.join(' ') + '">' + columnNames[i] + '</th>');
          columnBreakpoints.pop();
        } else {
          $("#firstRow").append('<th class="none">' + columnNames[i] + '</th>');
        }
      };
      $("#firstRow").append('<th class="none print-button">Operation</th>');
      columnObj.push({
        "orderable": false,
        "data": null,
        "defaultContent": '<a href="#" onClick="printOrder();">Print selected summaries</a>'
      });
      columnDefs.push({
        className: 'control',
        orderable: false,
        targets: 0
      });

      var table = $('#orderTable').DataTable({
        "responsive": {
          details: {
            type: 'column',
            target: 'tr',
            renderer: function (api, rowIdx, columns) {
              var data = $.map(columns, function (col, i) {
                // We customise how we want to show the data when the plus sign is clicked
                if (col.hidden && col.data) {
                  if (col.data.includes("http")) {
                    return '<tr data-dt-row="' + col.rowIndex + '" data-dt-column="' + col.columnIndex + '">' +
                      '<td>' + col.title + '</td> ' +
                      '<td class="pdf-link" onClick=' + 'window.open("' + col.data + '")>' + col.data + '</td>' +
                      '</tr>';
                  } else {
                    return '<tr data-dt-row="' + col.rowIndex + '" data-dt-column="' + col.columnIndex + '">' +
                      '<td>' + col.title + ':' + '</td> ' +
                      '<td style="white-space:initial;">' + col.data + '</td>' +
                      '</tr>';
                  }
                } else {
                  return '';
                }
              }).join('');

              return data ?
                $('<table/>').append(data) :
                false;
            }
          }
        },
        "pageLength": pageLength,
        "lengthChange": false,
        "bServerSide": false,
        "bProcessing": true,
        "data": sheetData,
        "aoColumns": columnObj,
        "aoColumnDefs": columnDefs,
        "order": [
          [0, null]
        ],
        "breakpoints": [{
            name: 'bigdesktop',
            width: Infinity
          },
          {
            name: 'meddesktop',
            width: 1480
          },
          {
            name: 'smalldesktop',
            width: 1280
          },
          {
            name: 'medium',
            width: 1188
          },
          {
            name: 'tabletl',
            width: 1024
          },
          {
            name: 'btwtabllandp',
            width: 848
          },
          {
            name: 'tabletp',
            width: 768
          },
          {
            name: 'mobilel',
            width: 480
          },
          {
            name: 'mobilep',
            width: 320
          }
        ],
        "fnCreatedRow": function (nRow, aData, iDataIndex) {
          var value = aData[columnObj[1].mDataProp].replace(/\s+/g, ' ').replace(/'/g, "\\'").trim();
          if ($("#state-box option[value='" + value + "']").length == 0) {
            $('<option/>').val(value).html(value).appendTo('#state-box');
          };
          var dataArray = aData[columnObj[2].mDataProp].replace(/\s+/g, ' ').replace(/'/g, "\\'").trim().split(",");
          dataArray.forEach(function (entry) {
            if ($("#issue-box option[value='" + entry.trim() + "']").length == 0) {
              $('<option/>').val(entry.trim()).html(entry.trim()).appendTo('#issue-box');
            };
          });
        },
        "fixedHeader": {
          header: true
        }
      });

      $('select#state-box').on('change', function (e) {
        if ($(this).find(":selected").text() === "All State") {
          table.column(1).search("\\*\\", true, false).draw();
        } else {
          table.column(1).search($(this).find(":selected").val()).draw();
        }
      });

      $('select#issue-box').on('change', function (e) {
        if ($(this).find(":selected").text() === "All Issues") {
          table.column(2).search("").draw();
        } else {
          table.column(2).search($(this).find(":selected").val()).draw();
        }
      });

      // This block creates accepted query strings from the column names.
      // We set all the column case to lower case and use the first word of
      // the column name if it two contains two or more string, separated by
      // . , + - / " ' ; : and space.
      for (var name of columnNames) {
        queryArray.push(name.toLowerCase().split(/[\+\s,-//\."':;]+/)[0]);
      }

      for (var key of urlParams.keys()) {
        if (queryArray.includes(key)) {
          var index = queryArray.indexOf(key);
          var value = urlParams.get(key);

          table.column(index).search(value).draw();

          /*if (key === "state") {
              $("#state-box option[value="+value+"]").attr('selected', 'selected');
          }*/
        } else if ( !(isNaN(key)) ) {
          var index = parseInt(key);
          if (key < queryArray.length) {
            value = urlParams.get(key);
            table.column(index).search(value).draw();
          }
        }
      };

      $("#loader").hide();
      $("#full-container").show();
    })
});

function printOrder() {
  // Build the printer version
  var rowData = $(".parent").children();
  var newEntry = false;
  var colIndex = 0;

  for (var i = 0; i < rowData.length; i++) {
    // Only useful when there are multiple entries being printed.
    // It makes sure to reset the column length index variable.
    if (colIndex === columnNames.length) {
      colIndex = 0;
    }

    // Only useful when there are multiple entries being printed.
    // Adds a breaker between two entries.
    // Also stops the sorting column from being printed.
    if (rowData[i].className === "control sorting_1") {
      if (newEntry === true) {
        $("#print-table").append('<tr><td></td><td></td></tr>');
        $("#print-table").append('<tr><td></td><td> <b>NEW ENTRY</b> </td></tr>');
        $("#print-table").append('<tr><td></td><td></td></tr>');
        newEntry = false;
      }
      continue;
    }

    // Stops the print column from being printed.
    if (rowData[i].innerText === "Print selected summaries") {
      newEntry = true;
      continue;
    }

    if (rowData[i].innerText) {
      $("#print-table").append('<tr><td><b>' + columnNames[colIndex] + '</b></td><td>' + rowData[i].innerText + '</td></tr>');
    }
    colIndex++;
  };

  // Show the print dialoge box
  window.print();
  // Remove all the entries information from thr print table
  $("#print-table").html('<tr><td style="width:24%;"></td><td></td></tr>');
}
