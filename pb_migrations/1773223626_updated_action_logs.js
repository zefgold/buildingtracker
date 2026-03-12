/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1990155814")

  // add field
  collection.fields.addAt(1, new Field({
    "cascadeDelete": true,
    "collectionId": "pbc_2484833797",
    "hidden": false,
    "id": "relation1204587666",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "action",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "relation"
  }))

  // add field
  collection.fields.addAt(2, new Field({
    "hidden": false,
    "id": "number1532651968",
    "max": null,
    "min": null,
    "name": "week",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(3, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text2862495610",
    "max": 0,
    "min": 0,
    "name": "date",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": true,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(4, new Field({
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
  collection.fields.addAt(5, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text3182418120",
    "max": 0,
    "min": 0,
    "name": "author",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": true,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(6, new Field({
    "hidden": false,
    "id": "select2363381545",
    "maxSelect": 1,
    "name": "type",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "select",
    "values": [
      "note",
      "change",
      "owner",
      "status"
    ]
  }))

  // add field
  collection.fields.addAt(7, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text999008199",
    "max": 0,
    "min": 0,
    "name": "text",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": true,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(8, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text1542800728",
    "max": 0,
    "min": 0,
    "name": "field",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(9, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text604077355",
    "max": 0,
    "min": 0,
    "name": "from_value",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(10, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text374040836",
    "max": 0,
    "min": 0,
    "name": "to_value",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1990155814")

  // remove field
  collection.fields.removeById("relation1204587666")

  // remove field
  collection.fields.removeById("number1532651968")

  // remove field
  collection.fields.removeById("text2862495610")

  // remove field
  collection.fields.removeById("select1914026624")

  // remove field
  collection.fields.removeById("text3182418120")

  // remove field
  collection.fields.removeById("select2363381545")

  // remove field
  collection.fields.removeById("text999008199")

  // remove field
  collection.fields.removeById("text1542800728")

  // remove field
  collection.fields.removeById("text604077355")

  // remove field
  collection.fields.removeById("text374040836")

  return app.save(collection)
})
