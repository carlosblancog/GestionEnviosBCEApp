sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/routing/History"
], function (Controller, History) {
    "use strict";

    return Controller.extend("zbce.envios.controller.Main", {

        onInit: function () {
            this.getOwnerComponent().getRouter()
                .getRoute("Main")
                .attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function () {
            this.byId("tablaCabeceras").getBinding("items").refresh();
        },

        onNuevoEnvio: function () {
            this.getOwnerComponent().getRouter().navTo("EnvioManual");
        },

        onRefresh: function () {
            this.byId("tablaCabeceras").getBinding("items").refresh();
        },

        onEnvioPress: function (oEvent) {
            // En el futuro: navegar a detalle del envio
            var oItem = oEvent.getSource();
            var sId = oItem.getBindingContext().getProperty("IdCabecera");
            sap.m.MessageToast.show("Envio: " + sId);
        },

        formatEstadoState: function (sEstado) {
            var mMap = {
                "C": "Success",
                "W": "Warning",
                "R": "Error",
                "F": "Error",
                "E": "Information"
            };
            return mMap[sEstado] || "None";
        }
    });
});
