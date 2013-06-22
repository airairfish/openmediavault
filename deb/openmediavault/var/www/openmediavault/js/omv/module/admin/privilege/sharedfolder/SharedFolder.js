/**
 * This file is part of OpenMediaVault.
 *
 * @license   http://www.gnu.org/licenses/gpl.html GPL Version 3
 * @author    Volker Theile <volker.theile@openmediavault.org>
 * @copyright Copyright (c) 2009-2013 Volker Theile
 *
 * OpenMediaVault is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * any later version.
 *
 * OpenMediaVault is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with OpenMediaVault. If not, see <http://www.gnu.org/licenses/>.
 */
// require("js/omv/WorkspaceManager.js")
// require("js/omv/tree/Folder.js")
// require("js/omv/window/Window.js")
// require("js/omv/window/FolderBrowser.js")
// require("js/omv/grid/Privileges.js")
// require("js/omv/toolbar/Tip.js")
// require("js/omv/workspace/grid/Panel.js")
// require("js/omv/workspace/window/Form.js")
// require("js/omv/workspace/window/Grid.js")
// require("js/omv/workspace/window/plugin/ConfigObject.js")
// require("js/omv/Rpc.js")
// require("js/omv/data/Store.js")
// require("js/omv/data/Model.js")
// require("js/omv/data/proxy/Rpc.js")
// require("js/omv/form/CompositeField.js")

/**
 * @class OMV.module.admin.privilege.sharedfolder.SharedFolder
 * @derived OMV.workspace.window.Form
 */
Ext.define("OMV.module.admin.privilege.sharedfolder.SharedFolder", {
	extend: "OMV.workspace.window.Form",
	uses: [
		"OMV.data.Model",
		"OMV.data.Store",
		"OMV.window.FolderBrowser",
		"OMV.workspace.window.plugin.ConfigObject"
	],

	rpcService: "ShareMgmt",
	rpcGetMethod: "get",
	rpcSetMethod: "set",
	plugins: [{
		ptype: "configobject"
	}],
	width: 500,
	height: 290,

	/**
	 * The class constructor.
	 * @fn constructor
	 * @param uuid The UUID of the database/configuration object. Required.
	 */

	getFormItems: function() {
		var me = this;
		return [{
			xtype: "textfield",
			name: "name",
			fieldLabel: _("Name"),
			allowBlank: false,
			readOnly: (me.uuid !== OMV.UUID_UNDEFINED),
			vtype: "sharename"
		},{
			xtype: "combo",
			name: "mntentref",
			fieldLabel: _("Volume"),
			emptyText: _("Select a volume ..."),
			allowBlank: false,
			allowNone: false,
			editable: false,
			readOnly: (me.uuid !== OMV.UUID_UNDEFINED),
			triggerAction: "all",
			displayField: "description",
			valueField: "uuid",
			store: Ext.create("OMV.data.Store", {
				autoLoad: true,
				model: OMV.data.Model.createImplicit({
					idProperty: "uuid",
					fields: [
						{ name: "uuid", type: "string" },
						{ name: "devicefile", type: "string" },
						{ name: "description", type: "string" }
					]
				}),
				proxy: {
					type: "rpc",
					rpcData: {
						service: "ShareMgmt",
						method: "getCandidates"
					},
					appendSortParams: false
				},
				sorters: [{
					direction: "ASC",
					property: "devicefile"
				}]
			})
		},{
			xtype: "trigger",
			name: "reldirpath",
			fieldLabel: _("Path"),
			allowBlank: false,
			triggerCls: "x-form-folder-trigger",
			plugins: [{
				ptype: "fieldinfo",
				text: _("The path of the folder to share. The specified folder will be created if it does not already exist."),
			}],
			onTriggerClick: function() {
				// Get the UUID of the selected volume.
				var field = me.findField("mntentref");
				var value = field.getValue();
				if(Ext.isUUID(value)) {
					Ext.create("OMV.window.FolderBrowser", {
						uuid: value,
						listeners: {
							scope: this,
							select: function(wnd, node, path) {
								// Set the selected path.
								this.setValue(path);
							}
						}
					}).show();
				} else {
					OMV.MessageBox.info(null, _("Please first select a volume."));
				}
			}
		},{
			xtype: "combo",
			name: "mode",
			fieldLabel: _("Permissions"),
			queryMode: "local",
			store: Ext.create("Ext.data.ArrayStore", {
				fields: [ "value", "text" ],
				data: [
					[ "700", _("Administrator: read/write, Users: no access, Others: no access") ],
					[ "750", _("Administrator: read/write, Users: read-only, Others: no access") ],
					[ "770", _("Administrator: read/write, Users: read/write, Others: no access") ],
					[ "755", _("Administrator: read/write, Users: read-only, Others: read-only") ],
					[ "775", _("Administrator: read/write, Users: read/write, Others: read-only") ],
					[ "777", _("Everyone: read/write") ]
				]
			}),
			displayField: "text",
			valueField: "value",
			allowBlank: false,
			editable: false,
			showItemTooltip: true,
			triggerAction: "all",
			hidden: (me.uuid !== OMV.UUID_UNDEFINED),
			submitValue: (me.uuid == OMV.UUID_UNDEFINED),
			value: "775",
			plugins: [{
				ptype: "fieldinfo",
				text: _("The file mode of the shared folder path.")
			}]
		},{
			xtype: "textarea",
			name: "comment",
			fieldLabel: _("Comment"),
			allowBlank: true
		}];
	}
});

/**
 * @class OMV.module.admin.privilege.sharedfolder.Privileges
 * @derived OMV.workspace.window.Grid
 * @param uuid The UUID of the configuration object. Required.
 * @param readOnly True if the property values are read-only. The 'OK'
 *   button will be disabled in this case. Defaults to FALSE.
 */
Ext.define("OMV.module.admin.privilege.sharedfolder.Privileges", {
	extend: "OMV.workspace.window.Grid",
	uses: [
		"OMV.Rpc",
		"OMV.grid.Privileges",
		"OMV.toolbar.Tip",
		"OMV.workspace.window.plugin.ConfigObject"
	],

	autoLoadData: false,
	rpcService: "ShareMgmt",
	rpcSetMethod: "setPrivileges",
	plugins: [{
		ptype: "configobject"
	}],
	gridClassName: "OMV.grid.Privileges",

	title: _("Edit shared folder privileges"),
	width: 550,
	height: 350,

	getGridConfig: function() {
		var me = this;
		return {
			border: false,
			stateful: true,
			stateId: "474eacf4-cadb-4ae4-b545-4f7f47d7aed9",
			readOnly: me.readOnly,
			uuid: me.uuid,
			dockedItems: [{
				xtype: "tiptoolbar",
				dock: "bottom",
				ui: "footer",
				text: _("These settings are used by the services to configure the user access rights. Please note that these settings do no affect the file system permissions.")
			}]
		};
	},

	getRpcSetParams: function() {
		var me = this;
		var privileges = [];
		var items = me.getValues();
		Ext.Array.each(items, function(item) {
			if((true === item.deny) || (true === item.readonly) ||
			  (true === item.writeable)) {
				var perms = 0;
				if(true === item.readonly)
					perms = 5;
				else if(true === item.writeable)
					perms = 7;
				privileges.push({
					type: item.type,
					name: item.name,
					perms: perms
				});
			}
		});
		return {
			privileges: privileges
		};
	}
});

/**
 * @class OMV.module.admin.privilege.sharedfolder.ACL
 * @derived OMV.window.Window
 * @param uuid The UUID of the configuration object. Required.
 * @param rootText The name of the shared folder.
 * @param readOnly True if the property values are read-only. The 'OK'
 *   button will be disabled in this case. Defaults to FALSE.
 */
Ext.define("OMV.module.admin.privilege.sharedfolder.ACL", {
	extend: "OMV.window.Window",
	uses: [
		"OMV.Rpc",
		"OMV.grid.Privileges",
		"OMV.tree.Folder",
		"OMV.util.Format",
		"OMV.form.CompositeField"
	],

	readOnly: false,

	title: _("Modify shared folder ACL"),
	width: 600,
	height: 520,
	layout: "border",
	modal: true,
	buttonAlign: "center",
	border: false,

	initComponent: function() {
		var me = this;
		me.tp = Ext.create("OMV.tree.Folder", {
			region: "west",
			title: _("Directory"),
			split: true,
			width: 210,
			collapsible: true,
			uuid: me.uuid,
			type: "sharedfolder",
			rootVisible: true,
			root: {
				text: me.rootText
			},
			listeners: {
				scope: me,
				select: function(tree, record, index, eOpts) {
					// Display load mask.
					this.getEl().mask(_("Loading ..."));
					// Load the ACL list.
					OMV.Rpc.request({
						scope: this,
						callback: function(id, success, response) {
							if(!success) {
								this.getEl().unmask();
								OMV.MessageBox.error(null, response);
							} else {
								// Set the form field values.
								this.fp.setValues({
									owner: response.owner,
									group: response.group,
									userperms: response.acl.user,
									groupperms: response.acl.group,
									otherperms: response.acl.other
								});
								// Set the grid values.
								var data = [];
								[ "user", "group" ].each(function(type) {
									response["acl"][type + "s"].each(
									  function(r) {
										data.push({
											type: type,
											name: r.name,
											perms: r.perms,
											system: r.system
										});
									}, this);
								}, this);
								this.gp.store.loadData(data);
								// Disable load mask.
								this.getEl().unmask();
							}
						},
						relayErrors: true,
						rpcData: {
							service: "ShareMgmt",
							method: "getFileACL",
							params: {
								uuid: this.uuid,
								file: record.get("path")
							}
						}
					});
				},
				afterrender: function(tree, eOpts) {
					// Auto-select the root node and fire event to display
					// the directory ACL settings.
					var node = tree.getRootNode();
					var selModel = tree.getSelectionModel();
					selModel.select([ node ]);
				}
			}
		});
		me.gp = Ext.create("OMV.grid.Privileges", {
			title: _("User/Group permissions"),
			region: "center",
			readOnly: me.readOnly,
			stateful: true,
			stateId: "dbda0692-aea5-11e2-9c6a-00221568ca88",
			autoLoadData: false,
			uuid: me.uuid,
			hideSystemColumn: false
		});
		me.fp = Ext.create("OMV.form.Panel", {
			title: _("Extra options"),
			region: "south",
			split: true,
			collapsible: true,
			bodyPadding: "5 5 0",
			border: true,
			items: [{
				xtype: "compositefield",
				fieldLabel: _("Owner"),
				items: [{
					xtype: "textfield",
					name: "owner",
					readOnly: true,
					submitValue: false,
					flex: 1,
					value: _("n/a")
				},{
					xtype: "combo",
					name: "userperms",
					queryMode: "local",
					store: Ext.create("Ext.data.ArrayStore", {
						fields: [ "value", "text" ],
						data: [
							[ 0, _("No access") ],
							[ 5, _("Read-only") ],
							[ 7, _("Read/Write") ]
						]
					}),
					displayField: "text",
					valueField: "value",
					allowBlank: false,
					editable: false,
					triggerAction: "all",
					flex: 1,
					value: 7
				}],
				plugins: [{
					ptype: "fieldinfo",
					text: _("Permissions of owner.")
				}]
			},{
				xtype: "compositefield",
				fieldLabel: _("Group"),
				items: [{
					xtype: "textfield",
					name: "group",
					readOnly: true,
					submitValue: false,
					flex: 1,
					value: _("n/a")
				},{
					xtype: "combo",
					name: "groupperms",
					queryMode: "local",
					store: Ext.create("Ext.data.ArrayStore", {
						fields: [ "value", "text" ],
						data: [
							[ 0, _("No access") ],
							[ 5, _("Read-only") ],
							[ 7, _("Read/Write") ]
						]
					}),
					displayField: "text",
					valueField: "value",
					allowBlank: false,
					editable: false,
					triggerAction: "all",
					flex: 1,
					value: 7
				}],
				plugins: [{
					ptype: "fieldinfo",
					text: _("Permissions of group.")
				}]
			},{
				xtype: "combo",
				name: "otherperms",
				fieldLabel: _("Others"),
				queryMode: "local",
				store: Ext.create("Ext.data.ArrayStore", {
					fields: [ "value", "text" ],
					data: [
						[ 0, _("No access") ],
						[ 5, _("Read-only") ],
						[ 7, _("Read/Write") ]
					]
				}),
				displayField: "text",
				valueField: "value",
				allowBlank: false,
				editable: false,
				triggerAction: "all",
				value: 0,
				plugins: [{
					ptype: "fieldinfo",
					text: _("Permissions of others (e.g. anonymous FTP users).")
				}]
			},{
				xtype: "checkbox",
				name: "replace",
				fieldLabel: _("Replace"),
				checked: false,
				boxLabel: _("Replace all existing permissions")
			},{
				xtype: "checkbox",
				name: "recursive",
				fieldLabel: _("Recursive"),
				checked: false,
				boxLabel: _("Apply permissions to files and subfolders")
			}]
		});
		Ext.apply(me, {
			buttons: [{
				text: _("Apply"),
				handler: me.onApplyButton,
				scope: me,
				disabled: me.readOnly
			},{
				text: _("Close"),
				handler: me.close,
				scope: me
			}],
			items: [ me.tp, me.gp, me.fp ]
		});
		me.callParent(arguments);
	},

	/**
	 * @method onApplyButton
	 * Method that is called when the 'Apply' button is pressed.
	 */
	onApplyButton: function() {
		var me = this;
		var node = me.tp.getSelectionModel().getSelection()[0];
		var records = me.gp.store.getRange();
		// Prepare RPC parameters.
		var options = me.fp.getValues();
		var users = [];
		var groups = [];
		Ext.Array.each(records, function(record) {
			if((true === record.get("deny")) ||
			  (true === record.get("readonly")) ||
			  (true === record.get("writeable"))) {
				var object = {
					"name": record.get("name"),
					"perms": 0
				}
				if(true === record.get("readonly"))
					object.perms = 5;
				else if(true === record.get("writeable"))
					object.perms = 7;
				switch(record.get("type")) {
				case "user":
					users.push(object);
					break;
				case "group":
					groups.push(object);
					break;
				}
			}
		});
		// Use the execute dialog to execute the RPC because it might
		// take some time depending on how much files/dirs must be
		// processed.
		Ext.create("OMV.window.Execute", {
			title: _("Updating ACL settings"),
			width: 350,
			rpcService: "ShareMgmt",
			rpcMethod: "setFileACL",
			rpcParams: {
				uuid: me.uuid,
				file: node.get("path"),
				recursive: options.recursive,
				replace: options.replace,
				user: options.userperms,
				group: options.groupperms,
				other: options.otherperms,
				users: users,
				groups: groups
			},
			hideStartButton: true,
			hideStopButton: true,
			hideCloseButton: true,
			progress: true,
			listeners: {
				scope: me,
				start: function(wnd) {
					wnd.show();
				},
				finish: function(wnd) {
					var value = wnd.getValue();
					wnd.close();
					if(value.length > 0) {
						OMV.MessageBox.error(null, value);
					}
				},
				exception: function(wnd, response) {
					wnd.close();
					OMV.MessageBox.error(null, response);
				}
			}
		}).start();
	}
});

/**
 * @class OMV.module.admin.privilege.sharedfolder.SharedFolders
 * @derived OMV.workspace.grid.Panel
 */
Ext.define("OMV.module.admin.privilege.sharedfolder.SharedFolders", {
	extend: "OMV.workspace.grid.Panel",
	requires: [
		"OMV.Rpc",
		"OMV.data.Store",
		"OMV.data.Model",
		"OMV.data.proxy.Rpc",
		"OMV.util.Format"
	],
	uses: [
		"OMV.module.admin.privilege.sharedfolder.SharedFolder",
		"OMV.module.admin.privilege.sharedfolder.Privileges",
		"OMV.module.admin.privilege.sharedfolder.ACL"
	],

	hidePagingToolbar: false,
	stateful: true,
	stateId: "9ab0d7f9-73e0-4815-8960-84157d4b85e5",
	columns: [{
		text: _("Name"),
		sortable: true,
		dataIndex: "name",
		stateId: "name"
	},{
		text: _("Volume"),
		sortable: true,
		dataIndex: "volume",
		stateId: "volume"
	},{
		text: _("Path"),
		sortable: true,
		dataIndex: "reldirpath",
		stateId: "reldirpath"
	},{
		text: _("Comment"),
		sortable: true,
		dataIndex: "comment",
		stateId: "comment"
	},{
		xtype: "booleantextcolumn",
		text: _("Used"),
		sortable: true,
		dataIndex: "_used",
		stateId: "_used"
	}],

	initComponent: function() {
		var me = this;
		Ext.apply(me, {
			store: Ext.create("OMV.data.Store", {
				autoLoad: true,
				model: OMV.data.Model.createImplicit({
					idProperty: "uuid",
					fields: [
						{ name: "uuid", type: "string" },
						{ name: "name", type: "string" },
						{ name: "reldirpath", type: "string" },
						{ name: "comment", type: "string" },
						{ name: "volume", type: "string" },
						{ name: "posixacl", mapping: "mntent.posixacl" },
						{ name: "_used", type: "boolean" }
					]
				}),
				proxy: {
					type: "rpc",
					rpcData: {
						service: "ShareMgmt",
						method: "getList"
					}
				}
			})
		});
		me.callParent(arguments);
	},

	getTopToolbarItems: function() {
		var me = this;
		var items = me.callParent(arguments);
		// Add the 'Privileges' button.
		Ext.Array.insert(items, 2, [{
			id: me.getId() + "-privileges",
			xtype: "button",
			text: _("Privileges"),
			icon: "images/group.png",
			iconCls: Ext.baseCSSPrefix + "btn-icon-16x16",
			handler: me.onPrivilegesButton,
			scope: me,
			disabled: true
		},{
			id: me.getId() + "-acl",
			xtype: "button",
			text: _("ACL"),
			icon: "images/access.png",
			iconCls: Ext.baseCSSPrefix + "btn-icon-16x16",
			handler: me.onACLButton,
			scope: me,
			disabled: true
		}]);
		return items;
	},

	onSelectionChange: function(model, records) {
		var me = this;
		me.callParent(arguments);
		// Process additional buttons.
		var tbarBtnName = [ "privileges", "acl" ];
		var tbarBtnDisabled = {
			"privileges": true,
			"acl": true
		};
		if(records.length <= 0) {
			tbarBtnDisabled["privileges"] = true;
			tbarBtnDisabled["acl"] = true;
		} else if(records.length == 1) {
			tbarBtnDisabled["privileges"] = false;
			tbarBtnDisabled["acl"] = !(records[0].get("posixacl") === true);
		} else {
			tbarBtnDisabled["privileges"] = true;
			tbarBtnDisabled["acl"] = true;
		}
		for(var i = 0; i < tbarBtnName.length; i++) {
			var tbarBtnCtrl = me.queryById(me.getId() + "-" +
			  tbarBtnName[i]);
			if(!Ext.isEmpty(tbarBtnCtrl)) {
				if(true == tbarBtnDisabled[tbarBtnName[i]]) {
					tbarBtnCtrl.disable();
				} else {
					tbarBtnCtrl.enable();
				}
			}
		}
	},

	onAddButton: function() {
		var me = this;
		Ext.create("OMV.module.admin.privilege.sharedfolder.SharedFolder", {
			title: _("Add shared folder"),
			uuid: OMV.UUID_UNDEFINED,
			listeners: {
				scope: me,
				submit: function() {
					me.doReload();
				}
			}
		}).show();
	},

	onEditButton: function() {
		var me = this;
		var record = me.getSelected();
		Ext.create("OMV.module.admin.privilege.sharedfolder.SharedFolder", {
			title: _("Edit shared folder"),
			uuid: record.get("uuid"),
			listeners: {
				scope: me,
				submit: function() {
					me.doReload();
				}
			}
		}).show();
	},

	onPrivilegesButton: function() {
		var me = this;
		var record = me.getSelected();
		Ext.create("OMV.module.admin.privilege.sharedfolder.Privileges", {
			uuid: record.get("uuid")
		}).show();
	},

	onACLButton: function() {
		var me = this;
		var record = me.getSelected();
		Ext.create("OMV.module.admin.privilege.sharedfolder.ACL", {
			uuid: record.get("uuid"),
			rootText: record.get("name")
		}).show();
	},

	startDeletion: function(records) {
		var me = this;
		if(records.length <= 0)
			return;
		OMV.MessageBox.show({
			title: _("Delete content"),
			msg: _("Do you want to remove the content of the shared folder recursively? The shared folder content will be permanently removed and cannot be recovered. Select 'No' to delete the shared folder configuration only or 'Cancel' to abort."),
			icon: Ext.Msg.QUESTION,
			buttonText: {
				yes: _("No"),
				no: _("Yes"),
				cancel: _("Cancel")
			},
			scope: me,
			fn: function(answer) {
				me.deleteRecursive = false;
				switch (answer) {
				case "no": // Recursively delete data
					OMV.MessageBox.show({
						title: _("Confirmation"),
						msg: _("Do you really want to remove the shared folder content? It will be permanently removed and cannot be recovered."),
						buttons: OMV.Msg.YESCANCEL,
						fn: function(answer) {
							if(answer === "yes") {
								me.deleteRecursive = true;
								me.superclass.startDeletion.apply(this,
								  [ records ]);
							}
						},
						scope: this,
						icon: Ext.Msg.QUESTION
					});
					break;
				case "yes": // Configuration only
					me.superclass.startDeletion.apply(this, [ records ]);
					break;
				case "cancel":
					break;
				}
			}
		});
	},

	doDeletion: function(record) {
		var me = this;
		OMV.Rpc.request({
			scope: me,
			callback: me.onDeletion,
			rpcData: {
				service: "ShareMgmt",
				method: "delete",
				params: {
					uuid: record.get("uuid"),
					recursive: me.deleteRecursive
				}
			}
		});
	},

	afterDeletion: function() {
		var me = this;
		me.callParent(arguments);
		// Delete private variable which is not required anymore.
		delete me.deleteRecursive;
	}
});

OMV.WorkspaceManager.registerNode({
	id: "sharedfolder",
	path: "/privilege",
	text: _("Shared Folders"),
	icon16: "images/sharedfile.png",
	iconSvg: "images/sharedfile.svg",
	position: 30
});

OMV.WorkspaceManager.registerPanel({
	id: "sharedfolders",
	path: "/privilege/sharedfolder",
	text: _("Shared Folders"),
	position: 10,
	className: "OMV.module.admin.privilege.sharedfolder.SharedFolders"
});