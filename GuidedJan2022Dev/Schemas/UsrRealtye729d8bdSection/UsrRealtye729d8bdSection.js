define("UsrRealtye729d8bdSection", ["ServiceHelper"], function(ServiceHelper) {
	return {
		entitySchemaName: "UsrRealty",
		details: /**SCHEMA_DETAILS*/{}/**SCHEMA_DETAILS*/,
		diff: /**SCHEMA_DIFF*/[]/**SCHEMA_DIFF*/,
		methods: {
            getSectionActions: function() {
                /* Вызывается родительская реализация метода для получения коллекции проинициализированных действий раздела. */
                var actionMenuItems = this.callParent(arguments);
                /* Добавляет линию-разделитель. */
                actionMenuItems.addItem(this.getButtonMenuItem({
                    Type: "Terrasoft.MenuSeparator",
                    Caption: ""
                }));
                /* Добавляет пункт меню в список действий раздела. */
                actionMenuItems.addItem(this.getButtonMenuItem({
                    /* Привязка заголовка пункта меню к локализуемой строке схемы. */
                    "Caption": {bindTo: "Resources.Strings.CalcRealtySum"},
                    /* Привязка метода-обработчика действия. */
                    "Click": {bindTo: "runCalcSum"},
                    /* Привязка свойства доступности пункта меню к значению, которое возвращает метод isCustomActionEnabled. */
                    "Enabled": {bindTo: "getCalcSumActionEnabled"}
                }));
                /* Возврат дополненной коллекции действий раздела. */
                return actionMenuItems;
            },
			runCalcSum: function() {
				var activeRowId = this.get("ActiveRow");
				if (!activeRowId) {
					return;
				}
				var gridData = this.get("GridData");
				var selectedRealty = gridData.get(activeRowId);
				if (!selectedRealty) {
					return;
				}
				var realtyTypeObject = selectedRealty.get("UsrRealtyType");
				var typeId = null;
				if (realtyTypeObject) {
					typeId = realtyTypeObject.value;
				}
				var offerTypeObject = selectedRealty.get("UsrOfferType");
				var offerTypeId = null;
				if (offerTypeObject) {
					offerTypeId = offerTypeObject.value;
				}			
				
				var data = {
					realtyTypeId: typeId,
					realtyOfferTypeId: offerTypeId
				};
				this.console.log("1");
				ServiceHelper.callService("RealtyService", "CalcSum", this.getWebServiceResult, data, this);
				this.console.log("2");
			},

			getWebServiceResult: function(response, success) {
				this.console.log("3");
				this.Terrasoft.showInformation("Total amount by typeId: " + response.GetTotalAmountByTypeIdResult);
			},
			getCalcSumActionEnabled: function() {
				var activeRowId = this.get("ActiveRow");
				var result = !!activeRowId;
				return result;
			}
		}
	};
});
