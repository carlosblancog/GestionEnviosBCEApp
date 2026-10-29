sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/routing/History",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageBox",
    "zbce/envios/controller/formatter"
], function (Controller, History, JSONModel, Filter, FilterOperator, MessageBox, formatter) {
    "use strict";

    return Controller.extend("zbce.envios.controller.Detail", {

        formatter: formatter,

        onInit: function () {
            var oDetailModel = new JSONModel({ comunicaciones: [], ultimoReenvio: "" });
            this.getView().setModel(oDetailModel, "detailModel");

            var oMensajesModel = new JSONModel({ titulo: "", mensajes: [] });
            this.getView().setModel(oMensajesModel, "mensajesModel");

            var oInformeModel = new JSONModel({ titulo: "", lineas: [] });
            this.getView().setModel(oInformeModel, "informeModel");

            this._oMensajesDialog = null;
            this._oInformeDialog = null;

            this.getOwnerComponent().getRouter()
                .getRoute("Detail")
                .attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function (oEvent) {
            var sIdCabecera = decodeURIComponent(oEvent.getParameter("arguments").idCabecera);
            this._bindCabecera(sIdCabecera);
            this._loadComunicaciones(sIdCabecera);
        },

        _bindCabecera: function (sIdCabecera) {
            this.getView().bindElement({
                path: "/EnviosCabeceraSet('" + sIdCabecera + "')",
                events: {
                    dataReceived: function (oEvent) {
                        if (!oEvent.getParameter("data")) {
                            MessageBox.warning("No se encontro el envio: " + sIdCabecera);
                        }
                    }
                }
            });
        },

        _loadComunicaciones: function (sIdCabecera) {
            var oModel = this.getOwnerComponent().getModel();
            oModel.read("/EnviosComunicaSet", {
                filters: [new Filter("IdCabecera", FilterOperator.EQ, sIdCabecera)],
                urlParameters: { "$orderby": "NumEnvio asc" },
                success: function (oData) {
                    var aComunicaciones = oData.results || [];
                    this.getView().getModel("detailModel")
                        .setProperty("/comunicaciones", aComunicaciones);

                    // Fecha del ultimo reenvio: FechaEnvio de la comunicacion con NumEnvio mas alto > 1
                    var oDetailModel = this.getView().getModel("detailModel");
                    var aReenvios = aComunicaciones.filter(function (c) { return c.NumEnvio > 1; });
                    if (aReenvios.length > 0) {
                        oDetailModel.setProperty("/ultimoReenvio", aReenvios[aReenvios.length - 1].FechaEnvio);
                    } else {
                        oDetailModel.setProperty("/ultimoReenvio", "");
                    }
                }.bind(this),
                error: function (oError) {
                    MessageBox.error("Error al cargar las comunicaciones: " + (oError.message || ""));
                }
            });
        },

        onNavBack: function () {
            var sPreviousHash = History.getInstance().getPreviousHash();
            if (sPreviousHash !== undefined) {
                window.history.go(-1);
            } else {
                this.getOwnerComponent().getRouter().navTo("Main");
            }
        },

        onVerMensajes: function (oEvent) {
            var oCtx = oEvent.getSource().getBindingContext("detailModel");
            if (!oCtx) { return; }

            var sIdEnvio      = oCtx.getProperty("IdEnvio");
            var sCorrelationId = oCtx.getProperty("CorrelationId");

            var sTitulo = this.getView().getModel("i18n").getResourceBundle()
                .getText("tituloMensajesDialog") + " — " + sCorrelationId;
            this.getView().getModel("mensajesModel").setProperty("/titulo", sTitulo);

            var oModel = this.getOwnerComponent().getModel();
            oModel.read("/EnviosMensajesSet", {
                filters: [new Filter("IdEnvio", FilterOperator.EQ, sIdEnvio)],
                urlParameters: { "$orderby": "Orden asc" },
                success: function (oData) {
                    this.getView().getModel("mensajesModel")
                        .setProperty("/mensajes", oData.results || []);
                    this._abrirMensajesDialog();
                }.bind(this),
                error: function (oError) {
                    MessageBox.error("Error al cargar los mensajes: " + (oError.message || ""));
                }
            });
        },

        _abrirMensajesDialog: function () {
            if (!this._oMensajesDialog) {
                var that = this;
                sap.ui.require(["sap/ui/core/Fragment"], function (Fragment) {
                    Fragment.load({
                        id: that.getView().getId(),
                        name: "zbce.envios.fragment.MensajesDialog",
                        controller: that
                    }).then(function (oDialog) {
                        that._oMensajesDialog = oDialog;
                        that.getView().addDependent(oDialog);
                        oDialog.open();
                    });
                });
            } else {
                this._oMensajesDialog.open();
            }
        },

        onCloseMensajesDialog: function () {
            if (this._oMensajesDialog) {
                this._oMensajesDialog.close();
            }
        },

        onVerInforme: function () {
            var oCtx = this.getView().getBindingContext();
            if (!oCtx) { return; }

            var sIdInforme = oCtx.getProperty("Auxiliar");
            var sClave     = oCtx.getProperty("Clave");
            if (!sIdInforme) {
                MessageBox.warning("Este envío no tiene informe asociado.");
                return;
            }

            var sTitulo = this.getView().getModel("i18n").getResourceBundle()
                .getText("tituloInformeDialog") + " — " + sClave;
            this.getView().getModel("informeModel").setProperty("/titulo", sTitulo);
            this.getView().getModel("informeModel").setProperty("/lineas", []);

            var oModel = this.getOwnerComponent().getModel();
            oModel.callFunction("/GetInformeData", {
                method: "GET",
                urlParameters: { IdInforme: sIdInforme },
                success: function (oData) {
                    var aLineas = oData.results || [];
                    this.getView().getModel("informeModel").setProperty("/lineas", aLineas);
                    this._abrirInformeDialog();
                }.bind(this),
                error: function (oError) {
                    MessageBox.error("Error al cargar los datos del informe: " + (oError.message || ""));
                }
            });
        },

        _abrirInformeDialog: function () {
            if (!this._oInformeDialog) {
                var that = this;
                sap.ui.require(["sap/ui/core/Fragment"], function (Fragment) {
                    Fragment.load({
                        id: that.getView().getId(),
                        name: "zbce.envios.fragment.InformeDialog",
                        controller: that
                    }).then(function (oDialog) {
                        that._oInformeDialog = oDialog;
                        that.getView().addDependent(oDialog);
                        oDialog.open();
                    });
                });
            } else {
                this._oInformeDialog.open();
            }
        },

        onCloseInformeDialog: function () {
            if (this._oInformeDialog) {
                this._oInformeDialog.close();
            }
        }
    });
});
