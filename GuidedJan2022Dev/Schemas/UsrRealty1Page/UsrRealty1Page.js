define("UsrRealty1Page", [], function() {
	return {
		entitySchemaName: "UsrRealty",
		attributes: {
			"UsrCommissionUSD": {
				"dataValueType": Terrasoft.DataValueType.FLOAT2,
				"type": this.Terrasoft.ViewModelColumnType.VIRTUAL_COLUMN,
				"value": 0,
				"dependencies": [
					{
						"columns": ["UsrOfferType", "UsrPriceUSD"],
						"methodName": "calcCommission"
					}
				]
			},
			"UsrOfferType": {
				lookupListConfig: {
					columns: ["UsrCoeff"]
				},
			}
		},
		modules: /**SCHEMA_MODULES*/{}/**SCHEMA_MODULES*/,
		details: /**SCHEMA_DETAILS*/{
			"Files": {
				"schemaName": "FileDetailV2",
				"entitySchemaName": "UsrRealtyFile",
				"filter": {
					"masterColumn": "Id",
					"detailColumn": "UsrRealty"
				}
			},
			"Schema43095ac6Detaila2618709": {
				"schemaName": "UsrRealtyVisitDetailGrid",
				"entitySchemaName": "UsrRealtyVisit",
				"filter": {
					"detailColumn": "UsrRealty",
					"masterColumn": "Id"
				}
			}
		}/**SCHEMA_DETAILS*/,
		businessRules: /**SCHEMA_BUSINESS_RULES*/{
			"UsrOwner": {
				"88ce18b1-b4c5-45b8-847d-fb6e2b59c457": {
					"uId": "88ce18b1-b4c5-45b8-847d-fb6e2b59c457",
					"enabled": true,
					"removed": false,
					"ruleType": 0,
					"property": 2,
					"logical": 0,
					"conditions": [
						{
							"comparisonType": 3,
							"leftExpression": {
								"type": 1,
								"attribute": "UsrOfferType"
							},
							"rightExpression": {
								"type": 0,
								"value": "0a86e401-f26d-409e-bf32-accdb1885ca7",
								"dataValueType": 10
							}
						},
						{
							"comparisonType": 7,
							"leftExpression": {
								"type": 1,
								"attribute": "UsrPriceUSD"
							},
							"rightExpression": {
								"type": 0,
								"value": 100000,
								"dataValueType": 5
							}
						}
					]
				},
				"1837faca-11c0-4163-9aad-0d8970f90572": {
					"uId": "1837faca-11c0-4163-9aad-0d8970f90572",
					"enabled": true,
					"removed": false,
					"ruleType": 1,
					"baseAttributePatch": "Type",
					"comparisonType": 4,
					"autoClean": false,
					"autocomplete": false,
					"type": 0,
					"value": "60733efc-f36b-1410-a883-16d83cab0980",
					"dataValueType": 10
				}
			}
		}/**SCHEMA_BUSINESS_RULES*/,
		methods: {
			setValidationConfig: function() {
                /* Вызывает инициализацию валидаторов родительской модели представления. */
                this.callParent(arguments);
                /* Для колонки [UsrPriceUSD] добавляется метод-валидатор */
                this.addColumnValidator("UsrPriceUSD", this.positiveValueValidator);
                this.addColumnValidator("UsrAreaM2", this.positiveValueValidator);
            },
			
			positiveValueValidator: function(value, column) {
				var msg = "";
				//var price = this.get("UsrPriceUSD");
				if (value < 0) {
					msg = this.get("Resources.Strings.ValueMustBePositive");
				}
				return {
                    invalidMessage: msg
                };				
			},
			
			calcCommission: function() {
				let price = this.get("UsrPriceUSD");
				if (!price) {
					price = 0;
				}
				let result = 0;
				let offerTypeObject = this.get("UsrOfferType");
				if (offerTypeObject) {
					//let coeff = 0.02;
					//let rental_id = "41c7af6b-4b78-46d2-a191-ead61ea8ea39";
					//let offerTypeId = offerTypeObject.value;
					/*if (offerTypeId == rental_id) {
						coeff = 0.5;
					}*/
					let coeff = offerTypeObject.UsrCoeff;
					result = price * coeff;
					//this.console.log("result = " + result);
				}
				this.set("UsrCommissionUSD", result);
			},
			onEntityInitialized: function() {
				this.callParent(arguments);
				this.calcCommission();
			},
			asyncValidate: function(callback, scope) {
				this.callParent([
						function(response) {
					if (!this.validateResponse(response)) {
						return;
					}
					this.validateRealtyData(function(response) {
						if (!this.validateResponse(response)) {
							return;
						}
						callback.call(scope, response);
					}, this);
				}, this]);
			},
			validateRealtyData: function(callback, scope) {
				// create query for server side
				var esq = this.Ext.create("Terrasoft.EntitySchemaQuery", {
					rootSchemaName: "UsrRealty"
				});
				esq.addAggregationSchemaColumn("UsrPriceUSD", Terrasoft.AggregationType.SUM, "PriceSum");
				var OfferTypeObject = this.get("UsrOfferType");
				var offerTypeId = null;
				if (OfferTypeObject) {
					offerTypeId = OfferTypeObject.value;
					var offerTypeFilter = esq.createColumnFilterWithParameter(this.Terrasoft.ComparisonType.EQUAL,
							"UsrOfferType", offerTypeId);
					esq.filters.addItem(offerTypeFilter);
				}
				// run query
				esq.getEntityCollection(function(response) {
					if (response.success && response.collection) {
						var sum = 0;
						var items = response.collection.getItems();
						if (items.length > 0) {
							sum = items[0].get("PriceSum");
						}
						var max = 10000000;
						if (sum > max) {
							if (callback) {
								callback.call(this, {
									success: false,
									message: "You cannot save, because sum = " + sum + " is bigger than " + max
								});
							}
						} else
						if (callback) {
							callback.call(scope, {
								success: true
							});
						}
					}
				}, this);
			},
			onCalcAveragePriceButtonClick: function() {
				var esq = Ext.create("Terrasoft.EntitySchemaQuery", {
				    rootSchemaName: "UsrRealty"
				});

				esq.addAggregationSchemaColumn("UsrPriceUSD", Terrasoft.AggregationType.AVG, "AvgPriceUSD");
				esq.addAggregationSchemaColumn("Id", Terrasoft.AggregationType.COUNT, "RecordsCount");

				var realtyTypeObject = this.get("UsrRealtyType");
				if (realtyTypeObject) {
					var realtyTypeId = realtyTypeObject.value;
					var filterRealtyType = esq.createColumnFilterWithParameter(
						Terrasoft.ComparisonType.EQUAL, "UsrRealtyType", realtyTypeId);
					esq.filters.addItem(filterRealtyType);
				}
				var realtyOfferTypeObject = this.get("UsrOfferType");
				if (realtyOfferTypeObject) {
					var offerTypeId = realtyOfferTypeObject.value;
					var filterRealtyOfferType = esq.createColumnFilterWithParameter(
						Terrasoft.ComparisonType.EQUAL, "UsrOfferType", offerTypeId);
					esq.filters.addItem(filterRealtyOfferType);
				}
				this.console.log("раз!");
				esq.getEntityCollection(this.getAvgPriceDataResult, this);
				this.console.log("два!");
				
			},
            getAvgPriceDataResult: function(response) {
				this.console.log("три!");
				var result = 0;
				var count = 0;
				if (response.success) {
				    Terrasoft.each(response.collection.getItems(), function(item) {
				        result = item.values.AvgPriceUSD;
				        count = item.values.RecordsCount;
				        }, this);
				    var textMessage = this.get("Resources.Strings.AvgResultMessage") + result + ", " + count + " " +
				    	this.get("Resources.Strings.RecordsCountMessage");
				    Terrasoft.showInformation(textMessage);
				}
            },
			getMyButtonEnabled: function() {
				var result = true;
				var price = this.get("UsrPriceUSD");
				if (!price) {
					result = false;
				}
				return result;
			}
		},
		dataModels: /**SCHEMA_DATA_MODELS*/{}/**SCHEMA_DATA_MODELS*/,
		diff: /**SCHEMA_DIFF*/[
			{
				"operation": "insert",
				"name": "Name7920fb98-e463-4086-a7a9-6fffdac64115",
				"values": {
					"layout": {
						"colSpan": 24,
						"rowSpan": 1,
						"column": 0,
						"row": 0,
						"layoutName": "ProfileContainer"
					},
					"bindTo": "UsrName",
					"enabled": true
				},
				"parentName": "ProfileContainer",
				"propertyName": "items",
				"index": 0
			},
			{
				"operation": "insert",
				"name": "FLOAT7ed36343-f8c1-44e0-89f1-3d42e2043922",
				"values": {
					"layout": {
						"colSpan": 24,
						"rowSpan": 1,
						"column": 0,
						"row": 1,
						"layoutName": "ProfileContainer"
					},
					"bindTo": "UsrPriceUSD",
					"enabled": true
				},
				"parentName": "ProfileContainer",
				"propertyName": "items",
				"index": 1
			},
			{
				"operation": "insert",
				"name": "UsrAreaM208854cc3-cad2-4182-a5ef-85a3ec960069",
				"values": {
					"layout": {
						"colSpan": 24,
						"rowSpan": 1,
						"column": 0,
						"row": 2,
						"layoutName": "ProfileContainer"
					},
					"bindTo": "UsrAreaM2",
					"tip": {
						"content": {
							"bindTo": "Resources.Strings.UsrAreaM208854cc3cad24182a5ef85a3ec960069Tip"
						}
					},
					"enabled": true
				},
				"parentName": "ProfileContainer",
				"propertyName": "items",
				"index": 2
			},
			{
				"operation": "insert",
				"name": "Commission",
				"values": {
					"layout": {
						"colSpan": 24,
						"rowSpan": 1,
						"column": 0,
						"row": 3,
						"layoutName": "ProfileContainer"
					},
					"bindTo": "UsrCommissionUSD",
					"enabled": false,
					"caption": {
						"bindTo": "Resources.Strings.CommissionCaption"
					}
				},
				"parentName": "ProfileContainer",
				"propertyName": "items",
				"index": 3
			},
			
            /* Метаданные для добавления на страницу пользовательской кнопки. */
            {
                /* Выполняется операция добавления элемента на страницу. */
                "operation": "insert",
                /* Мета-имя родительского контейнера, в который добавляется кнопка. */
                "parentName": "ProfileContainer",
                /* Кнопка добавляется в коллекцию элементов родительского элемента. */
                "propertyName": "items",
                /* Мета-имя добавляемой кнопки. */
                "name": "CalcButton",
                /* Свойства, передаваемые в конструктор элемента. */
                "values": {
					"layout": {
						"colSpan": 6,
						"rowSpan": 1,
						"column": 6,
						"row": 4,
						"layoutName": "ProfileContainer"
					},
                    /* Тип добавляемого элемента — кнопка. */
                    "itemType": Terrasoft.ViewItemType.BUTTON,
                    /* Привязка заголовка кнопки к локализуемой строке схемы. */
                    "caption": {bindTo: "Resources.Strings.CalcButtonCaption"},
                    /* Привязка метода-обработчика нажатия кнопки. */
                    "click": {bindTo: "onCalcAveragePriceButtonClick"},
                    /* Привязка свойства доступности кнопки. */
                    "enabled": {bindTo: "getMyButtonEnabled"},
                    /* Стиль отображения кнопки. */
                    "style": Terrasoft.controls.ButtonEnums.style.BLUE
                }
            },			
			
			{
				"operation": "insert",
				"name": "LOOKUP6e26f5f9-3ac0-4ab3-983b-c74b55ceec3e",
				"values": {
					"layout": {
						"colSpan": 12,
						"rowSpan": 1,
						"column": 0,
						"row": 0,
						"layoutName": "Header"
					},
					"bindTo": "UsrRealtyType",
					"enabled": true,
					"contentType": 3
				},
				"parentName": "Header",
				"propertyName": "items",
				"index": 0
			},
			{
				"operation": "insert",
				"name": "LOOKUP5f1eb9fe-fd5a-4aaa-adf9-263a863b9075",
				"values": {
					"layout": {
						"colSpan": 12,
						"rowSpan": 1,
						"column": 12,
						"row": 0,
						"layoutName": "Header"
					},
					"bindTo": "UsrOfferType",
					"enabled": true,
					"contentType": 3
				},
				"parentName": "Header",
				"propertyName": "items",
				"index": 1
			},
			{
				"operation": "insert",
				"name": "LOOKUP4e2cf742-fff6-43ff-8a34-c4e92bc10449",
				"values": {
					"layout": {
						"colSpan": 12,
						"rowSpan": 1,
						"column": 0,
						"row": 1,
						"layoutName": "Header"
					},
					"bindTo": "UsrOwner",
					"enabled": true,
					"contentType": 5
				},
				"parentName": "Header",
				"propertyName": "items",
				"index": 2
			},
			{
				"operation": "insert",
				"name": "LOOKUP0de8d46b-ea0e-48f2-a29d-31031ee18df9",
				"values": {
					"layout": {
						"colSpan": 12,
						"rowSpan": 1,
						"column": 12,
						"row": 1,
						"layoutName": "Header"
					},
					"bindTo": "UsrEmployeeContact",
					"enabled": true,
					"contentType": 5
				},
				"parentName": "Header",
				"propertyName": "items",
				"index": 3
			},
			{
				"operation": "insert",
				"name": "STRINGd88f6fc0-e70a-41fa-bfd9-9781af66dbdb",
				"values": {
					"layout": {
						"colSpan": 24,
						"rowSpan": 2,
						"column": 0,
						"row": 2,
						"layoutName": "Header"
					},
					"bindTo": "UsrComment",
					"enabled": true,
					"contentType": 0
				},
				"parentName": "Header",
				"propertyName": "items",
				"index": 4
			},
			{
				"operation": "insert",
				"name": "Tab027f7ef5TabLabel",
				"values": {
					"caption": {
						"bindTo": "Resources.Strings.Tab027f7ef5TabLabelTabCaption"
					},
					"items": [],
					"order": 0
				},
				"parentName": "Tabs",
				"propertyName": "tabs",
				"index": 0
			},
			{
				"operation": "insert",
				"name": "Schema43095ac6Detaila2618709",
				"values": {
					"itemType": 2,
					"markerValue": "added-detail"
				},
				"parentName": "Tab027f7ef5TabLabel",
				"propertyName": "items",
				"index": 0
			},
			{
				"operation": "insert",
				"name": "NotesAndFilesTab",
				"values": {
					"caption": {
						"bindTo": "Resources.Strings.NotesAndFilesTabCaption"
					},
					"items": [],
					"order": 1
				},
				"parentName": "Tabs",
				"propertyName": "tabs",
				"index": 1
			},
			{
				"operation": "insert",
				"name": "Files",
				"values": {
					"itemType": 2
				},
				"parentName": "NotesAndFilesTab",
				"propertyName": "items",
				"index": 0
			},
			{
				"operation": "insert",
				"name": "NotesControlGroup",
				"values": {
					"itemType": 15,
					"caption": {
						"bindTo": "Resources.Strings.NotesGroupCaption"
					},
					"items": []
				},
				"parentName": "NotesAndFilesTab",
				"propertyName": "items",
				"index": 1
			},
			{
				"operation": "insert",
				"name": "Notes",
				"values": {
					"bindTo": "Notes",
					"dataValueType": 1,
					"contentType": 4,
					"layout": {
						"column": 0,
						"row": 0,
						"colSpan": 24
					},
					"labelConfig": {
						"visible": false
					},
					"controlConfig": {
						"imageLoaded": {
							"bindTo": "insertImagesToNotes"
						},
						"images": {
							"bindTo": "NotesImagesCollection"
						}
					}
				},
				"parentName": "NotesControlGroup",
				"propertyName": "items",
				"index": 0
			},
			{
				"operation": "merge",
				"name": "ESNTab",
				"values": {
					"order": 2
				}
			}
		]/**SCHEMA_DIFF*/
	};
});
