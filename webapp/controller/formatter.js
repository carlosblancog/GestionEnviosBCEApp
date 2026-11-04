sap.ui.define([], function () {
    "use strict";

    function parseUtcString(sValue) {
        var m = /^(\d{2})\.(\d{2})\.(\d{4}) (\d{2}):(\d{2}):(\d{2})$/.exec(sValue);
        if (!m) { return null; }
        return new Date(
            parseInt(m[3], 10), parseInt(m[2], 10) - 1, parseInt(m[1], 10),
            parseInt(m[4], 10), parseInt(m[5], 10),     parseInt(m[6], 10)
        );
    }

    function formatLocalDate(oDate) {
        var pad = function (n) { return String(n).padStart(2, "0"); };
        return pad(oDate.getDate()) + "." + pad(oDate.getMonth() + 1) + "." + oDate.getFullYear() +
               " " + pad(oDate.getHours()) + ":" + pad(oDate.getMinutes()) + ":" + pad(oDate.getSeconds());
    }

    return {

        formatUtcToLocal: function (sValue) {
            if (!sValue || sValue === "00.00.0000 00:00:00") { return ""; }
            var oDate = parseUtcString(sValue);
            if (!oDate || isNaN(oDate.getTime())) { return sValue; }
            return formatLocalDate(oDate);
        },

        textoFechaResp: function (sFecha) {
            if (!sFecha || sFecha === "00.00.0000 00:00:00") { return "Sin confirmación"; }
            var oDate = parseUtcString(sFecha);
            if (!oDate || isNaN(oDate.getTime())) { return sFecha; }
            return formatLocalDate(oDate);
        },

        textoFechaReenvio: function (sFecha) {
            if (!sFecha || sFecha === "00.00.0000 00:00:00") { return "Sin reenvíos"; }
            var oDate = parseUtcString(sFecha);
            if (!oDate || isNaN(oDate.getTime())) { return sFecha; }
            return formatLocalDate(oDate);
        },

        tipoInformeText: function (sTipoMensaje) {
            var sTipo = sTipoMensaje ? sTipoMensaje.slice(-1) : "";
            switch (sTipo) {
                case "U": return "Informe Diario";
                case "B": return "Informe Mensual";
                case "R": return "Informe Trimestral";
                default:  return sTipoMensaje || "";
            }
        },

        estadoColor: function (sEstado) {
            switch (sEstado) {
                case "1": return "#107E3E";
                case "3": return "#BB0000";
                case "9": return "#6C1220";
                case "":  return "#0070F2";
                default:  return "#8696A9";
            }
        },

        estadoText: function (sEstado) {
            switch (sEstado) {
                case "1": return "OK";
                case "3": return "KO";
                case "9": return "Error comunicación";
                case "":  return "En proceso";
                default:  return "Sin estado";
            }
        },

        estadoState: function (sEstado) {
            switch (sEstado) {
                case "1": return "Success";
                case "3": return "Error";
                case "9": return "Error";
                case "":  return "Information";
                default:  return "None";
            }
        },

        estadoIcon: function (sEstado) {
            switch (sEstado) {
                case "1": return "sap-icon://status-positive";
                case "3": return "sap-icon://status-negative";
                case "9": return "sap-icon://disconnected";
                case "":  return "sap-icon://status-in-process";
                default:  return "sap-icon://status-inactive";
            }
        },

        // Severidad SAP: S=Success I=Info W=Warning E=Error A=Abort
        severityIcon: function (sCode) {
            switch (sCode) {
                case "S": return "sap-icon://sys-enter-2";
                case "I": return "sap-icon://information";
                case "W": return "sap-icon://alert";
                case "E": return "sap-icon://error";
                case "A": return "sap-icon://cancel";
                default:  return "sap-icon://question-mark";
            }
        },

        severityColor: function (sCode) {
            switch (sCode) {
                case "S": return "#107E3E";
                case "I": return "#0070F2";
                case "W": return "#E9730C";
                case "E": return "#BB0000";
                case "A": return "#6C1220";
                default:  return "#8696A9";
            }
        },

        severityText: function (sCode) {
            switch (sCode) {
                case "S": return "Éxito";
                case "I": return "Información";
                case "W": return "Aviso";
                case "E": return "Error";
                case "A": return "Cancelado";
                default:  return sCode || "";
            }
        },

        formatBalance: function (sValue) {
            if (sValue === undefined || sValue === null || sValue === "") { return ""; }
            var oFormat = sap.ui.core.format.NumberFormat.getFloatInstance({
                groupingEnabled: true,
                groupingSeparator: ".",
                decimalSeparator: ",",
                minFractionDigits: 2,
                maxFractionDigits: 2
            });
            return oFormat.format(parseFloat(sValue));
        },

        fechaRespState: function (sFecha) {
            if (!sFecha || sFecha === "00.00.0000 00:00:00") { return "Error"; }
            return "None";
        }
    };
});
