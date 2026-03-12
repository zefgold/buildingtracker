/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2471705857")

  // add field
  collection.fields.addAt(1, new Field({
    "cascadeDelete": true,
    "collectionId": "pbc_3660498186",
    "hidden": false,
    "id": "relation3494172116",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "session",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "relation"
  }))

  // add field
  collection.fields.addAt(2, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text3617549073",
    "max": 0,
    "min": 0,
    "name": "participant",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": true,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(3, new Field({
    "hidden": false,
    "id": "select1914026624",
    "maxSelect": 1,
    "name": "org",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "RPN",
      "SHP",
      "SOMBP",
      "G&T"
    ]
  }))

  // add field
  collection.fields.addAt(4, new Field({
    "hidden": false,
    "id": "select2063623452",
    "maxSelect": 1,
    "name": "status",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "select",
    "values": [
      "present",
      "absent",
      "excused"
    ]
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2471705857")

  // remove field
  collection.fields.removeById("relation3494172116")

  // remove field
  collection.fields.removeById("text3617549073")

  // remove field
  collection.fields.removeById("select1914026624")

  // remove field
  collection.fields.removeById("select2063623452")

  return app.save(collection)
})
