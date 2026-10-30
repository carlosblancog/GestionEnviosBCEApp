sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/routing/History",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/BusyDialog"
], function (Controller, History, JSONModel, MessageBox, BusyDialog) {
    "use strict";

    return Controller.extend("zbce.envios.controller.EnvioManual", {

        onInit: function () {
            var oViewModel = new JSONModel({
                previewEnabled:  true,
                previewVisible:  false,
                confirmEnabled:  false,
                resultVisible:   false,
                resultMsg:       "",
                resultType:      "None",
                result:          {},
                previewData:     []
            });
            this.getView().setModel(oViewModel, "viewModel");

            this.getOwnerComponent().getRouter()
                .getRoute("EnvioManual")
                .attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function () {
            // Resetear estado al entrar
            var oVM = this.getView().getModel("viewModel");
            oVM.setProperty("/previewVisible",  false);
            oVM.setProperty("/confirmEnabled",  false);
            oVM.setProperty("/resultVisible",   false);
            oVM.setProperty("/previewData",     []);
        },

        onNavBack: function () {
            var oHistory = History.getInstance();
            var sPreviousHash = oHistory.getPreviousHash();
            if (sPreviousHash !== undefined) {
                window.history.go(-1);
            } else {
                this.getOwnerComponent().getRouter().navTo("Main");
            }
        },

        // ---- Paso 1: Previsualizar datos del CDS ----
        onPrevisualizar: function () {
            var oFecha = this.byId("dpFecha");
            var oTipo  = this.byId("selTipo");

            if (!oFecha.getValue()) {
                MessageBox.warning(this._i18n("msgFechaRequerida"));
                return;
            }

            var sFecha = oFecha.getValue();   // formato yyyyMMdd por valueFormat
            var sTipo  = oTipo.getSelectedKey();

            var oBusy = new BusyDialog({ text: this._i18n("msgCargandoPreview") });
            oBusy.open();

            var oModel = this.getView().getModel();
            oModel.callFunction("/GetInformePreview", {
                method: "GET",
                urlParameters: { Fecha: sFecha, Tipo: sTipo },
                success: function (oData) {
                    oBusy.close();
                    var aResults = oData.results || [];
                    var oVM = this.getView().getModel("viewModel");
                    oVM.setProperty("/previewData",    aResults);
                    oVM.setProperty("/previewVisible", true);
                    oVM.setProperty("/confirmEnabled", aResults.length > 0);
                    oVM.setProperty("/resultVisible",  false);
                }.bind(this),
                error: function (oError) {
                    oBusy.close();
                    MessageBox.error(this._i18n("msgErrorPreview"));
                }.bind(this)
            });
        },

        // ---- Paso 2: Confirmar y enviar ----
        onConfirmarEnvio: function () {
            var sFecha = this.byId("dpFecha").getValue();
            var sTipo  = this.byId("selTipo").getSelectedKey();
            var oI18n  = this;

            MessageBox.confirm(this._i18n("msgConfirmarEnvio"), {
                onClose: function (sAction) {
                    if (sAction === MessageBox.Action.OK) {
                        oI18n._ejecutarEnvio(sFecha, sTipo);
                    }
                }
            });
        },

        _ejecutarEnvio: function (sFecha, sTipo) {
            var oBusy = new BusyDialog({ text: this._i18n("msgEnviando") });
            oBusy.open();

            var oVM = this.getView().getModel("viewModel");
            oVM.setProperty("/confirmEnabled", false);

            var oModel = this.getView().getModel();
            oModel.callFunction("/EnviarInforme", {
                method:        "POST",
                urlParameters: { Fecha: sFecha, Tipo: sTipo },
                success: function (oData) {
                    oBusy.close();
                    if (oData.Success === true || oData.Success === "true") {
                        MessageBox.success(
                            this._i18n("msgEnvioOk") + " v" + oData.Version,
                            { onClose: function () {
                                this.getOwnerComponent().getRouter().navTo("Main");
                            }.bind(this) }
                        );
                    } else {
                        MessageBox.error(oData.ErrorMsg || this._i18n("msgEnvioFallido"));
                        oVM.setProperty("/confirmEnabled", true);
                    }
                }.bind(this),
                error: function () {
                    oBusy.close();
                    MessageBox.error(this._i18n("msgEnvioFallido"));
                    oVM.setProperty("/confirmEnabled", true);
                }.bind(this)
            });
        },

        _i18n: function (sKey) {
            return this.getView().getModel("i18n").getResourceBundle().getText(sKey);
        }
    });
});
