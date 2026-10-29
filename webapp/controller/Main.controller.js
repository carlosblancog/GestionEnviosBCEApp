sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "zbce/envios/controller/formatter"
], function (Controller, Filter, FilterOperator, formatter) {
    "use strict";

    return Controller.extend("zbce.envios.controller.Main", {

        formatter: formatter,

        onInit: function () {
            this._oTable             = null;
            this._sSearchValue       = "";
            this._oDateRangeFilter   = null;
            this._sEstadoFilter      = "all";
            this._iAutoRefreshTimer  = null;
            this._bAutoRefreshActive = false;

            this.getOwnerComponent().getRouter()
                .getRoute("Main")
                .attachPatternMatched(this._onRouteMatched, this);
        },

        onExit: function () {
            this._stopAutoRefresh();
        },

        _onRouteMatched: function () {
            if (!this._oTable) {
                this._oTable = this.byId("tablaCabeceras");
            }
            this._oTable.getBinding("items").refresh();
            this._loadEstadoCounts();
            if (!this._bAutoRefreshActive) {
                this._startAutoRefresh();
            }
        },

        /* =========================================================
           Auto-refresco
           ========================================================= */

        _startAutoRefresh: function () {
            var that = this;
            this._iAutoRefreshTimer = setInterval(function () {
                var oBinding = that._oTable && that._oTable.getBinding("items");
                if (oBinding) { oBinding.refresh(); }
                that._loadEstadoCounts();
            }, 60000);
            this._bAutoRefreshActive = true;
            this._updateAutoRefreshButton();
        },

        _stopAutoRefresh: function () {
            if (this._iAutoRefreshTimer) {
                clearInterval(this._iAutoRefreshTimer);
                this._iAutoRefreshTimer = null;
            }
            this._bAutoRefreshActive = false;
            this._updateAutoRefreshButton();
        },

        _updateAutoRefreshButton: function () {
            var oBtn = this.byId("btnAutoRefresh");
            if (!oBtn) { return; }
            var oBundle = this.getView().getModel("i18n").getResourceBundle();
            if (this._bAutoRefreshActive) {
                oBtn.setIcon("sap-icon://pause");
                oBtn.setTooltip(oBundle.getText("btnPausarAutoRefresh"));
            } else {
                oBtn.setIcon("sap-icon://play");
                oBtn.setTooltip(oBundle.getText("btnActivarAutoRefresh"));
            }
        },

        onToggleAutoRefresh: function () {
            if (this._bAutoRefreshActive) {
                this._stopAutoRefresh();
            } else {
                this._startAutoRefresh();
            }
        },

        /* =========================================================
           Contadores de pestanas
           ========================================================= */

        _loadEstadoCounts: function () {
            var oModel = this.getView().getModel();
            if (!oModel) { return; }
            var that = this;
            var aTabDefs = [
                { tabId: "tabTodos",    filter: null },
                { tabId: "tabOK",       filter: new Filter("Estado", FilterOperator.EQ, "C") },
                { tabId: "tabKO",       filter: new Filter({ filters: [
                    new Filter("Estado", FilterOperator.EQ, "R"),
                    new Filter("Estado", FilterOperator.EQ, "W")
                ], and: false }) },
                { tabId: "tabConexion", filter: new Filter("Estado", FilterOperator.EQ, "F") },
                { tabId: "tabSin",      filter: new Filter("Estado", FilterOperator.EQ, "E") }
            ];
            aTabDefs.forEach(function (oDef) {
                oModel.read("/EnviosCabeceraSet", {
                    filters: oDef.filter ? [oDef.filter] : [],
                    urlParameters: { "$inlinecount": "allpages", "$top": "0", "$select": "IdCabecera" },
                    success: function (oData) {
                        var oTab = that.byId(oDef.tabId);
                        if (oTab && oData.__count !== undefined) {
                            oTab.setCount(String(oData.__count));
                        }
                    }
                });
            });
        },

        /* =========================================================
           Filtro por estado (IconTabBar)
           ========================================================= */

        onEstadoTabSelect: function (oEvent) {
            this._sEstadoFilter = oEvent.getParameter("key");
            this._applyFilters();
            this._updateFilterInfo();
        },

        /* =========================================================
           Busqueda y fechas
           ========================================================= */

        onSearch: function (oEvent) {
            this._sSearchValue = oEvent.getParameter("newValue") || oEvent.getParameter("query") || "";
            this._applyFilters();
            this._updateFilterInfo();
        },

        onDateRangeChange: function () {
            var oFrom  = this.byId("datePickerFrom");
            var oTo    = this.byId("datePickerTo");
            var oStart = oFrom ? oFrom.getDateValue() : null;
            var oEnd   = oTo   ? oTo.getDateValue()   : null;

            this._oDateRangeFilter = null;

            if (oStart || oEnd) {
                var pad = function (n) { return String(n).padStart(2, "0"); };
                var fmt = function (d) {
                    return pad(d.getDate()) + "." + pad(d.getMonth() + 1) + "." + d.getFullYear();
                };
                var aF = [];
                if (oStart) { aF.push(new Filter("FechaEnvio", FilterOperator.GE, fmt(oStart) + " 00:00:00")); }
                if (oEnd)   { aF.push(new Filter("FechaEnvio", FilterOperator.LE, fmt(oEnd)   + " 23:59:59")); }
                this._oDateRangeFilter = aF.length === 1 ? aF[0] : new Filter({ filters: aF, and: true });
            }
            this._applyFilters();
            this._updateFilterInfo();
        },

        onClearDateFilters: function () {
            var oFrom = this.byId("datePickerFrom");
            var oTo   = this.byId("datePickerTo");
            if (oFrom) { oFrom.setValue(""); }
            if (oTo)   { oTo.setValue(""); }
            this._oDateRangeFilter = null;
            this._applyFilters();
            this._updateFilterInfo();
        },

        _applyFilters: function () {
            var aFilters = [];
            if (this._sEstadoFilter && this._sEstadoFilter !== "all") {
                if (this._sEstadoFilter === "OK") {
                    aFilters.push(new Filter("Estado", FilterOperator.EQ, "C"));
                } else if (this._sEstadoFilter === "KO") {
                    aFilters.push(new Filter({ filters: [
                        new Filter("Estado", FilterOperator.EQ, "R"),
                        new Filter("Estado", FilterOperator.EQ, "W")
                    ], and: false }));
                } else if (this._sEstadoFilter === "FC") {
                    aFilters.push(new Filter("Estado", FilterOperator.EQ, "F"));
                } else if (this._sEstadoFilter === "SIN") {
                    aFilters.push(new Filter("Estado", FilterOperator.EQ, "E"));
                }
            }
            if (this._sSearchValue && this._sSearchValue.trim().length > 0) {
                aFilters.push(new Filter("Clave", FilterOperator.Contains, this._sSearchValue.trim()));
            }
            if (this._oDateRangeFilter) {
                aFilters.push(this._oDateRangeFilter);
            }
            var oBinding = this._oTable && this._oTable.getBinding("items");
            if (oBinding) {
                oBinding.filter(aFilters, "Application");
            }
        },

        _updateFilterInfo: function () {
            var aParts = [];
            if (this._sSearchValue && this._sSearchValue.trim().length > 0) {
                aParts.push("\"" + this._sSearchValue.trim() + "\"");
            }
            if (this._oDateRangeFilter) {
                var sFrom = this.byId("datePickerFrom") ? this.byId("datePickerFrom").getValue() : "";
                var sTo   = this.byId("datePickerTo")   ? this.byId("datePickerTo").getValue()   : "";
                if (sFrom || sTo) { aParts.push((sFrom || "?") + " — " + (sTo || "?")); }
            }
            var oToolbar = this.byId("filterInfoToolbar");
            var oText    = this.byId("filterInfoText");
            if (aParts.length > 0) {
                oText.setText("Activo: " + aParts.join("  ·  "));
                oToolbar.setVisible(true);
            } else {
                oToolbar.setVisible(false);
            }
        },

        /* =========================================================
           Tabla
           ========================================================= */

        onTableUpdateFinished: function (oEvent) {
            var iTotal  = oEvent.getParameter("total");
            var oBundle = this.getView().getModel("i18n").getResourceBundle();
            this.byId("tableTitle").setText(oBundle.getText("titleHistorial") + " (" + iTotal + ")");
        },

        onRefresh: function () {
            var oBinding = this._oTable && this._oTable.getBinding("items");
            if (oBinding) { oBinding.refresh(); }
            this._loadEstadoCounts();
        },

        onNuevoEnvio: function () {
            this.getOwnerComponent().getRouter().navTo("EnvioManual");
        },

        onEnvioPress: function (oEvent) {
            var sId = oEvent.getSource().getBindingContext().getProperty("IdCabecera");
            this.getOwnerComponent().getRouter().navTo("Detail", {
                idCabecera: encodeURIComponent(sId)
            });
        }
    });
});
