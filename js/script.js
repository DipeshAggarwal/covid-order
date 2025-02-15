jQuery.extend( jQuery.fn.dataTableExt.oSort, {
  "date-uk-pre": function ( a ) {
    if (a == null || a == "") {
      return 0;
    }
    if (a.includes("aN/aN/NaN") || a.indexOf("/") === -1) {
      return 1;
    }
    var ukDatea = a.split('/');
    return (ukDatea[2] + ukDatea[1] + ukDatea[0]) * 1;
  },

  "date-uk-asc": function ( a, b ) {
    return ((a < b) ? -1 : ((a > b) ? 1 : 0));
  },

  "date-uk-desc": function ( a, b ) {
    console.log("a, b");
    return ((a < b) ? 1 : ((a > b) ? -1 : 0));
  }
} );

$(document).ready(function () {
  document.getElementById("footer-bottom").classList.add("stick-to-bottom");

  // This block of code ensures that endusers can search for orders until the current day
  // TODO: Add some sort of freeze in the future so that when the website it accessed years later,
  //       endusers don't get a too wide range to select
  // TODO: Get the start date from the sheet instead of hard coding it in.
  var today = new Date();
  var month = today.getMonth() + 1;
  $('#date-box').datepicker({
    format: "dd/mm/yyyy",
    startDate: "01/03/2020",
    endDate: today.getDate() + "/" + month + "/" + today.getUTCFullYear(),
    maxViewMode: 1,
    clearBtn: true
  });

  $('select#language-box').on('change', function (e) {
    if ($(this).find(":selected").val() === "english") {
      top.window.location = "https://covidorders.in/";
    } else {
      top.window.location = "https://covidorders.in/translate.html#" + $(this).find(":selected").val();
      /*window.location = "https://www.covid-india.in/translate.html?" + $(this).find(":selected").val();*/
    }
  });

  var scriptQuery = "";
  var pageLength = 10;
  var experimental = false;
  var columnBreakpoints = ["meddesktop", "meddesktop", "tabletp", "mobilel", "mobilep"];
  const urlParams = new URLSearchParams(window.location.search);
  queryArray = [""];

  // If a length query is given, show that many entries per page
  if (urlParams.get("length")) {
    // Ensure that the provided value is string
    if (!(isNaN(urlParams.get("length")))) {
      pageLength = parseInt(urlParams.get("length"));
    }
  };

  if (window.location.href.includes("covid-india.mox") ) {
    document.getElementById("language-box").value = "hindi";
  } else {
    if (window.location.protocol === "https:") {
      var currentSubDomain = window.location.hostname.replace("covidorders.in", "");
      scriptQuery = currentSubDomain.split(".")[0];
    }

    if (scriptQuery === "") {
      if (window.location.protocol === "file:") {
        scriptQuery = window.location.pathname.substring(window.location.pathname.lastIndexOf('/')+1).replace(".html", "");
      } else if (window.location.pathname != "/") {
        scriptQuery = window.location.pathname.substring(1).split(".")[0];
      }
    }
  }

  if (scriptQuery === "index") {
    scriptQuery = "";
  }

  $.ajax({
    url: "https://script.google.com/macros/s/AKfycbyYzQboz1iAe326HtyxJWgcPlwyPe7wLpCrLIRuf-kJBur4rqw/exec?sheet=" + scriptQuery,//"https://script.google.com/macros/s/AKfycby7AOxVGZUKTBUgTtPO5TGnudMAEUx9IdXeWE1rjgwjeIDGhcc/exec?sheet=" + scriptQuery,
    type: "GET",
    dataType: "json"
  })
    .done(function( data ) {
      adminData = data.admin;
      data = data.websiteData;
      columnNames = data.shift();
      sheetData = data;

      // This block generates accepted query strings from the column names.
      // We set all the column case to lower case and use the first word of
      // the column name if it two contains two or more string, separated by
      // . , + - / " ' ; : and space.
      for (var name of columnNames) {
        queryArray.push(name.trim().toLowerCase().split(/[\+\s,-//\."':;]+/)[0]);
      }

      sheetData.map(function(entry) {
        if (entry[2] != false) {
            var date = new Date(entry[2]);
            var month = date.getMonth() + 1;
            entry[2] = ("0" + date.getDate()).slice(-2) + "/" + ("0" + month).slice(-2) + "/" + date.getUTCFullYear();
        }
        
        var link = (window.location.protocol + "//" + window.location.hostname + "/?" + queryArray[1] + "=" + entry[0] + "&" + queryArray[2] + "=" + entry[1].replace("Latest order, ", "").replace("Latest order, ", "") + "&" + queryArray[3] + "=" + entry[2] + "&" + queryArray[4] + "=" + entry[3] + "&expand").replace(/ /g, "%20");
        return entry.push('<div class="pretend-link" data-value=' + link + ' onClick="copyToClipboard(this)"><span class="fa fa-copy">&nbsp;&nbsp;</span>Copy link to this Summary<span class="alert alert-success copied-text">COPIED</span></div>');
      });

      if (customField === true) {
        var columnObj = [{
          "orderable": false,
          "data": null,
          "defaultContent": ''
        }];
        var columnDefs = [{
          "width": "5%",
          "targets": 0
        }];
        // This is the first column which has the expand button
        columnDefs.push({
          className: 'control new-summary',
          orderable: false,
          targets: 0
        });

        // Hide Order Allocation column in the sheet
        columnDefs.push({
          targets: 26,
          searchable: false,
          visible: false
        })

        columnDefs.push({
          targets: 28,
          searchable: false,
          visible: false
        })

        columnDefs.push({
          targets: 29,
          searchable: false,
          visible: false
        })
      } else {
        var columnObj = [];
        var columnDefs = []; 
      }

      // Here we separate the data column wise to feed to DataTable
      for (var i = 0; i < columnNames.length; i++) {
        columnObj.push({
          "mDataProp": i
        });

        // The first five columns are given fixed width
        if (i < 6) {
          if ( i === 1) {
            columnDefs.push({
              "width": "20%",
              "targets": i
            });
          } else if ( i === 2) {
            columnDefs.push({
              "width": "20%",
              "targets": i
            });
          } else if (i === 3) {
            columnDefs.push({
              "width": "12%",
              "targets": i,
              "type": 'date-uk'
            });
          } else if (i === 5) {
            columnDefs.push({
              "width": "12%",
              "targets": i
            });
          } else {
            columnDefs.push({
              "width": "38%",
              "targets": i
            });
          }
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

      if (customField === true) {
        // Manually add the generated summary link button
        columnObj.push({
          "mDataProp": columnNames.length
        });
        $("#firstRow").append('<th class="none">Copy Link to Summary</th>');

        // Add a Print Column
        $("#firstRow").append('<th class="none not-print">Print</th>');
        columnObj.push({
          "orderable": false,
          "data": null,
          "defaultContent": '<a href="#" class="not-print" onClick="printOrder();"><span class="fa fa-print">&nbsp;&nbsp;</span>Print selected summaries</a>'
        });

        // Add a Download Column
        $("#firstRow").append('<th class="none not-print">Download</th>');
        columnObj.push({
          "orderable": false,
          "data": null,
          "defaultContent": '<a href="#" class="not-print" onClick="downloadOrderAsCSV(this);"><span class="fa fa-download">&nbsp;&nbsp;</span>Download selected summaries as CSV</a>'
        });

        if (experimental === true) {
          // Add a Download As Image Column
          $("#firstRow").append('<th class="none not-print">Download Image</th>');
          columnObj.push({
            "orderable": false,
            "data": null,
            "defaultContent": '<a href="#" class="not-print" onClick="downloadOrderAsImage(this);"><span class="fa fa-download">&nbsp;&nbsp;</span>Download this Order as an Image</a>'
          });
        }
      }

      //$("#updated-on").html("The data was last updated on <b>" + new Date(data[sheetName].raw.feed.updated.$t) + "</b>");

      var table = $('#orderTable').DataTable({
        "responsive": {
          details: {
            type: 'column',
            target: 'tr',
            renderer: function (api, rowIdx, columns) {
              var data = $.map(columns, function (col, i) {
                // We customise how we want to show the data when the plus sign is clicked
                if (col.hidden && col.data) {
                  if (typeof(col.data) === "string" && col.data.startsWith("http") && col.title != "Copy Link to Summary") {
                    return '<tr data-dt-row="' + col.rowIndex + '" data-dt-column="' + col.columnIndex + '">' +
                      '<td>' + col.title + '</td> ' +
                      '<td class="pdf-link" onClick=window.open("' + col.data + '")><span class="fa fa-external-link">&nbsp;&nbsp;</span>Click to view Order</td>' +
                      '</tr>';
                  } else {
                    return '<tr data-dt-row="' + col.rowIndex + '" data-dt-column="' + col.columnIndex + '">' +
                      '<td>' + col.title + ':' + '</td> ' +
                      '<td style="white-space:initial;">' + col.data.replace(new RegExp("\n", 'g'), "<br />") + '</td>' +
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
        "lengthChange": true,
        "lengthMenu": [10, 15, 20, 50, 100, 200],
        "bServerSide": false,
        "bProcessing": true,
        "drawCallback": function( settings ) {
          if (getDrawData === false){
            return;
          }
          var api = this.api();
          //console.log( api.rows( {page:'current'} ).data()[0] );
        },
        "dom": 'Bfrtlip',
        "buttons": [
          {
            text: 'Expand All Summaries',
            className: "shift-down not-print",
            attr: {
              style: "margin-bottom:-40px;"
            },
            action: function ( e, dt, node, config ) {
              if (table.rows('.parent').nodes().to$().find('td:first-child').trigger('click').length === 0) {
                table.rows(':not(.parent)').nodes().to$().find('td:first-child').trigger('click');
                this.text("Collapse All Summaries");
              } else {
                this.text("Expand All Summaries");
              }
            }
          },
          {
            text: '<i class="fa fa-train" aria-hidden="true"></i> <b>Migrants Travel Info</b>',
            className: "shift-down not-print",
            attr: {
              style: "margin-bottom:-40px;margin-left:25px;"
            },
            action: function ( e, dt, node, config ) {
              window.location.href = "https://migrants.covidorders.in/";
            }
          }
        ],
        "data": sheetData,
        "aoColumns": columnObj,
        "aoColumnDefs": columnDefs,
        "order": [
          [0, null],
          [3, "desc"]
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
        }],
        "fnCreatedRow": function (nRow, aData, iDataIndex) {
          if (customField === false) {
            return;
          }

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

      if (customField === true) {
        $('select#state-box').on('change', function (e) {
          if ($(this).find(":selected").text() === "All State") {
            table.column(1).search("\\*\\", true, false).draw();
          } else {
            table.column(1).search($(this).find(":selected").val()).draw();
          }
          table.rows('.parent').nodes().to$().find('td:first-child').trigger('click');
        });

        $('select#issue-box').on('change', function (e) {
          if ($(this).find(":selected").text() === "All Issues") {
            table.column(2).search("").draw();
          } else {
            table.column(2).search($(this).find(":selected").val()).draw();
          }
          table.rows('.parent').nodes().to$().find('td:first-child').trigger('click');
        });

        $('select#latest-box').on('change', function (e) {
          if ($(this).find(":selected").text() === "Show All Orders") {
            table.column(5).search("").draw();
          } else if ($(this).find(":selected").text() === "Only Court Orders") {
            table.column(5).search("Court").draw();
          }
          table.rows('.parent').nodes().to$().find('td:first-child').trigger('click');
        });

        /**$('select#colour-box').on('change', function (e) {
          document.documentElement.style.setProperty('--accent-color', $(this).find(":selected").val());
          document.documentElement.style.setProperty('--stripe-color', $(this).find(":selected").val()+"50");
        });**/

        $('input#date-box').on('change', function (e) {
          if ($(this).text() === "Search by Date") {
            table.column(3).search("").draw();
          } else {
            table.column(3).search($(this).val()).draw();
          }
          table.rows('.parent').nodes().to$().find('td:first-child').trigger('click');
        });
      }

      $('#show-all-btn').on('click', function (e) {
        document.getElementById("state-box").value = "";
        document.getElementById("issue-box").value = "";
        document.getElementById("date-box").value = "";
        table.column(1).search("").draw();
        table.column(2).search("").draw();
        table.column(3).search("").draw();
        table.column(4).search("").draw();
        $(this).hide();
      });

      $('#court-btn').on('click', function (e) {
        if ($("#court-btn").hasClass("court-showing")) {
          $("#court-btn").removeClass("court-showing");
          table.column(5).search("").draw();
          return;
        } else if ($("#court-btn").hasClass("health-showing")) {
          $("#court-btn").removeClass("health-showing");
          table.column(2).search("").draw();
        }
        
        $("#court-btn").addClass("court-showing");
        table.column(5).search("Court").draw();
      });

      $('#health-btn').on('click', function (e) {
        if ($("#health-btn").hasClass("health-showing")) {
          $("#health-btn").removeClass("health-showing");
          table.column(2).search("").draw();
          return;
        } else if ($("#health-btn").hasClass("court-showing")) {
          $("#health-btn").removeClass("court-showing");
          table.column(5).search("").draw();
        }
        
        $("#health-btn").addClass("health-showing");
        table.column(2).search("Health").draw();
      });

      var showAllButtonCounter = 0;
      for (var key of urlParams.keys()) {
        if (key === "date") {
          getDrawData = true;
        }
        if (queryArray.includes(key)) {
          var index = queryArray.indexOf(key);
          var valueOfKey = urlParams.get(key);

          table.column(index).search(valueOfKey).draw();

          if (key === "state") {
            document.getElementById("state-box").value = valueOfKey;
            showAllButtonCounter++;
          } else if (key === "issues") {
            document.getElementById("issue-box").value = valueOfKey.split(",")[0];
            showAllButtonCounter++;
          } else if (key === "date") {
            document.getElementById("date-box").value = valueOfKey;
            showAllButtonCounter++;
          } else if (key === "latest") {
            document.getElementById("latest-box").value = "Only Latest Orders";
            table.column(25).search("yes").draw();
          }
        } else if ( !(isNaN(key)) ) {
          var index = parseInt(key);
          if (key < queryArray.length) {
            valueOfKey = urlParams.get(key);
            table.column(index).search(valueOfKey).draw();
          }
        } else if (key === "expand") {
          table.rows(':not(.parent)').nodes().to$().find('td:first-child').trigger('click');
        }
      };
      getDrawData = false;

      if (showAllButtonCounter > 2) {
        $("#show-all-btn").show();
      }

      $("#loader").hide();
      document.getElementById("footer-bottom").classList.remove("stick-to-bottom");
      $("#printed-from").html('Printed from <a href="">' + window.location.protocol + "//" + window.location.hostname + '</a>');
    })
});

// A fallback in case the browser does not fire print events at the right time
var printSetupDone = false;
var getDrawData = false;

if (window.location.href.includes("stranded-workers")) {
  var customField = false;
} else {
  var customField = true;
}

// Copy text to clipboard
function copyToClipboard(obj) {
  const el = document.createElement('textarea');
  el.value = obj.getAttribute("data-value");
  document.body.appendChild(el);
  el.select();
  document.execCommand('copy');
  document.body.removeChild(el);
  
  // Fade in and fade out the copied text notification
  var ele = obj.lastChild;
  $(ele).fadeIn();
  setTimeout(function() {
    $(ele).fadeOut()
  }, 3000);
}

function downloadOrderAsImage(obj) {
  var rowData = $(obj).parents(".child").last().prevAll(".parent");
}

function prepareForCSV() {
  var dataCSV = [];
  var rowData = $(".parent").children();
  var rowDataCSV = [];
  var colIndex = 0;
  dataCSV.push(columnNames);

  for (var i = 0; i < rowData.length; i++) {
    if ($(rowData[i]).hasClass("new-summary")) {
      dataCSV.push(rowDataCSV.join(","));
      rowDataCSV = [];
      colIndex = 0;
      continue;
    }

    if (colIndex >= columnNames.length-1) {
      continue;
    }

    text = rowData[i].innerText.replace(/^[ ]+|[ ]+$/g, '');
    if (text.includes(",") || text.includes(";")) {
      rowDataCSV.push(text.replace(/\n/g, ' ; ').replace(/(.*)/g, '\"$1\"').replace('"""', '"')); 
    } else {
      rowDataCSV.push(text);
    }
    colIndex++;
  }

  dataCSV.push(rowDataCSV.join(","));
  return dataCSV.join("\n");
}

function downloadOrderAsCSV(link) {
  var dataCSV = prepareForCSV();
  var blob = new Blob([dataCSV], {
    type: 'text/csv;charset=utf-8;'
  });

  var url = URL.createObjectURL(blob);
  var a = link;
  a.download = "exported.csv";
  a.href = url;
}

function readyForPrinting() {
  // Build the printer version
  var rowData = $(".parent").children();
  var newEntry = false;
  var colIndex = 0;

  for (var i = 0; i < rowData.length; i++) {
    // Only useful when there are multiple entries being printed.
    // Adds a breaker between two entries.
    // Also stops the sorting column from being printed.
    if ($(rowData[i]).hasClass("new-summary")) {
      $("#print-table").append('<tr><td></td><td></td></tr>');
      $("#print-table").append('<tr><td></td><td> <b>NEW ENTRY</b> </td></tr>');
      $("#print-table").append('<tr><td></td><td></td></tr>');
      colIndex = 0;
      continue;
    }

    if (colIndex >= columnNames.length-1) {
      continue;
    }

    if (rowData[i].innerText) {
      $("#print-table").append('<tr><td><b>' + columnNames[colIndex] + '</b></td><td>' + rowData[i].innerText + '</td></tr>');
    }
    colIndex++;
  };
  
  // Add "not-print" class to main container
  // This is to ensure that when print of the entire page is taken
  // it does not come up as blank.
  $("#main-container").addClass("not-print");
  $("#print-container").addClass("print-this");
  printSetupDone = true;
}

function donePrinting() {
  // If this function has already been run or if the `readyForPrinting`
  // was never run, don't run this.
  if (printSetupDone === false) {
    return;
  }
  // Remove all the added classes
  $("#main-container").removeClass("not-print");
  $("#print-container").removeClass("print-this");

  // Remove all the entries information from thr print table
  $("#print-table").html('<tr><td style="width:24%;"></td><td></td></tr>');
  printSetupDone = false;

}

function printOrder() {
  readyForPrinting();
  window.print();
  donePrinting();
}

window.addEventListener('beforeprint', (event) => {
  // If user has expanded any entries, show the entries print format.
  // For click print job, don't do it as we want to take care of it
  // ourselves to make sure it happens regardless if the event fires
  // or not
  if ( $(".parent").length && printSetupDone === false ) {
    readyForPrinting();
  }
});

window.addEventListener('afterprint', (event) => {
  donePrinting();
});
