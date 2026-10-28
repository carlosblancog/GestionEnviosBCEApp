sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/Device",
    "zbce/envios/model/models"
], function (UIComponent, Device, models) {
    "use strict";

    return UIComponent.extend("zbce.envios.Component", {

        metadata: {
            manifest: "json"
        },

        init: function () {
            UIComponent.prototype.init.apply(this, arguments);
            this.setModel(models.createDeviceModel(), "device");
            this.getRouter().initialize();
        }
    });
});
