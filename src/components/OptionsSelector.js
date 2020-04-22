import React from "react";
import map from "lodash/map";
import {connect} from "react-redux";
import {AgGridReact} from "ag-grid-react";

import "ag-grid-community/dist/styles/ag-grid.css";
import "ag-grid-community/dist/styles/ag-theme-balham-dark.css";
// Override ag-grid theme
import "./OptionsSelector.css";

export class MinMaxFilter extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      min: "",
      max: "",
    };
  }

  valueChanged = (event) => {
    const that = this;
    this.setState(
      {
        [event.target.name]: event.target.value,
      },
      () => {
        this.props.parentFilterInstance(function (instance) {
          const {min, max} = that.state;
          if (min && max) {
            return instance.setModel({
              filterType: "number",
              type: "inRange",
              filter: min,
              filterTo: max,
            });
          }
          if (min) {
            return instance.setModel({
              filterType: "number",
              type: "greaterThanOrEqual",
              filter: min,
            });
          }
          if (max) {
            return instance.setModel({
              filterType: "number",
              type: "lessThanOrEqual",
              filter: max,
            });
          }
          return instance.setModel(null);
        });
      }
    );
  };

  onParentModelChanged(parentModel) {
    switch (parentModel ? parentModel.type : null) {
      case "greaterThan":
      case "greaterThanOrEqual": {
        return this.setState({
          min: parentModel.filter,
        });
      }
      case "lessThan":
      case "lessThanOrEqual": {
        return this.setState({
          max: parentModel.filter,
        });
      }
      case "inRange": {
        return this.setState({
          min: parentModel.filter,
          max: parentModel.filterTo,
        });
      }
      default: {
        return this.setState({
          min: "",
          max: "",
        });
      }
    }
  }

  render() {
    const style = {
      width: "30%",
      margin: "0 2px",
      padding: "1px",
      display: "flex",
      alignItems: "center",
    };
    return (
      <>
        <div style={{height: "100%"}} className="ag-floating-filter-input">
          <input
            className="ag-input-field-input ag-text-field-input"
            style={style}
            type="number"
            value={this.state.min}
            name="min"
            placeholder="MIN"
            onChange={this.valueChanged}
          />
          <input
            className="ag-input-field-input ag-text-field-input"
            style={style}
            type="number"
            value={this.state.max}
            name="max"
            placeholder="MAX"
            onChange={this.valueChanged}
          />
        </div>
      </>
    );
  }
}

export function OptionsSelector({options, instruments}) {
  const columnDefs = [
    {
      field: "instrumentName",
      headerName: "Instrument",
      comparator: (valueA, valueB, nodeA, nodeB, isInverted) => {
        if (nodeA.data.expirationTimestamp !== nodeB.data.expirationTimestamp) {
          return (
            nodeA.data.expirationTimestamp - nodeB.data.expirationTimestamp
          );
        }

        if (nodeA.data.strike !== nodeB.data.strike) {
          return nodeA.data.strike - nodeB.data.strike;
        }

        //https://stackoverflow.com/questions/51165/how-to-sort-strings-in-javascript
        return nodeA.data.optionType.localeCompare(nodeB.data.optionType);
      },
    },
    {
      field: "openInterest",
      filter: "agNumberColumnFilter",
      headerName: "Open Interest",
      type: "numericColumn",
    },
    {
      field: "markPrice",
      filter: "agNumberColumnFilter",
      headerName: "Mark Price",
      type: "numericColumn",
      valueFormatter: (params) =>
        `$${(params.value * params.data.underlyingPrice).toFixed(
          2
        )} (${params.value.toFixed(8)})`,
    },
    {
      field: "markIv",
      filter: "agNumberColumnFilter",
      headerName: "IV (Mark)",
      type: "numericColumn",
      valueFormatter: (params) => `${params.value.toFixed(2)}`,
    },
    ...[
      {headerName: "Delta", field: "greeks.delta"},
      {headerName: "Gamma", field: "greeks.gamma"},
      {headerName: "Vega", field: "greeks.vega"},
      {headerName: "Theta", field: "greeks.theta"},
    ].map((x) =>
      Object.assign(x, {
        filter: "agNumberColumnFilter",
        floatingFilterComponent: "customNumberMinMaxFilter",
        floatingFilterComponentParams: {suppressFilterButton: true},
        type: "numericColumn",
        valueFormatter: (params) => `${params.value.toFixed(5)}`,
      })
    ),
  ];

  const rowData = map(options, (values, instrumentName) => ({
    ...instruments[instrumentName],
    ...values,
  }));

  const onGridReady = (params) => {
    // console.log("Grid Ready", params);
    params.api.sizeColumnsToFit();
  };

  return (
    <div id="grid-wrapper">
      <div
        className="ag-theme-balham-dark"
        style={{
          height: "95vh",
          width: "100%",
        }}
      >
        <AgGridReact
          onGridReady={onGridReady}
          floatingFilter
          columnDefs={columnDefs}
          defaultColDef={{
            filter: true,
            resizable: true,
            sortable: true,
          }}
          rowData={rowData}
          // enable delta updates for redux
          deltaRowDataMode={true}
          getRowNodeId={(data) => data.instrumentName}
          frameworkComponents={{
            customNumberMinMaxFilter: MinMaxFilter,
          }}
        />
      </div>
    </div>
  );
}

export default connect(
  (state) => {
    return {
      options: state.tickers.tickers,
      instruments: state.instruments.instruments,
    };
  },
  null,
  null,
  {forwardRef: true} // must be supplied for react/redux when using AgGridReact
)(OptionsSelector);
