const test = require("tape");
const fs = require("fs");
const defold_parser = require("../defold-parser")


test('Defold Parsing Game Object', function (t) {
	let parsed_go = defold_parser.load_from_file("./tests/files/go.go")

	t.assert(parsed_go.embedded_components);
	t.assert(parsed_go.embedded_components[0].id == "pirates_ship_1");
	t.assert(parsed_go.embedded_components[0].position[0].x == 0)
	t.assert(parsed_go.embedded_components[0].rotation[0].w == 1)
	t.assert(parsed_go.embedded_components[0].data[0].load_dynamically[0] == "true")

	t.end();
});


test('Defold Parsing Collection', function (t) {
	let parsed_collection = defold_parser.load_from_file("./tests/files/collection.collection")
	let instance = parsed_collection.embedded_instances[1]

	t.assert(instance.id == "tile")
	let inner_component = instance.data[0].embedded_components[0]
	t.assert(inner_component.id[0] = "sprite")
	t.assert(inner_component.type[0] = "sprite")
	t.assert(inner_component.data[0].default_animation[0] == "tile_grid")
	t.assert(inner_component.data[0].blend_mode[0] == "BLEND_MODE_ALPHA")

	t.end();
});


test('Defold Parsing Font', function (t) {
	let parsed_font = defold_parser.load_from_file("./tests/files/font.font");

	t.assert(parsed_font.size == 40);
	t.assert(parsed_font.output_format == "TYPE_DISTANCE_FIELD");

	t.end();
});


test('Defold Parsing Atlas', function (t) {
	let parsed_atlas = defold_parser.load_from_file("./tests/files/atlas.atlas")

	t.assert(parsed_atlas.images.length == 4)
	t.assert(parsed_atlas.margin[0] == 0)
	t.assert(parsed_atlas.extrude_borders[0] == 2)

	t.end();
});


test('Defold Encode Atlas', function (t) {
	let file_path = "./tests/files/atlas.atlas"
	let content = fs.readFileSync(file_path, 'utf8')
	let parsed_atlas = defold_parser.decode_object(content)
	let encoded = defold_parser.encode_object(parsed_atlas)

	t.assert(content == encoded)
	t.end();
});


test('Defold Encode Font', function (t) {
	let file_path = "./tests/files/font.font"
	let content = fs.readFileSync(file_path, 'utf8')

	let parsed_font = defold_parser.decode_object(content)
	let encoded = defold_parser.encode_object(parsed_font)

	t.assert(content == encoded)
	t.end();
});


test('Defold Encode Game Object', function (t) {
	let file_path = "./tests/files/go.go"
	let content = fs.readFileSync(file_path, 'utf8')

	let parsed_go = defold_parser.decode_object(content)
	let encoded = defold_parser.encode_object(parsed_go)

	t.assert(content == encoded)
	t.end();
});


test('Defold Encode Collection', function (t) {
	let file_path = "./tests/files/collection.collection"
	let content = fs.readFileSync(file_path, 'utf8')

	let parsed_collection = defold_parser.decode_object(content)
	let encoded = defold_parser.encode_object(parsed_collection)

	t.assert(content == encoded)
	t.end();
});


test('Defold Encode ParticleFX', function (t) {
	let file_path = "./tests/files/particlefx.particlefx"
	let content = fs.readFileSync(file_path, 'utf8')

	let parsed_particlefx = defold_parser.decode_object(content)
	let encoded = defold_parser.encode_object(parsed_particlefx)

	t.assert(content == encoded)
	t.end();
});


test('Defold Parsing Collision Game Object', function (t) {
	let parsed_go = defold_parser.load_from_file("./tests/files/collision_go.go")


	let shape = parsed_go.embedded_components[0].data[0].embedded_collision_shape[0]
	t.assert(shape.shapes[0].shape_type[0] == "TYPE_BOX")
	t.assert(shape.data.length == 4)
	t.assert(shape.data[0] == 10.0)

	t.end();
});


test('Defold Encode Collision Game Object', function (t) {
	let file_path = "./tests/files/collision_go.go"
	let content = fs.readFileSync(file_path, 'utf8')

	let parsed_collision_go = defold_parser.decode_object(content)
	let encoded = defold_parser.encode_object(parsed_collision_go)

	t.assert(content == encoded)
	t.end();
});


test('Defold Encode Full Game Object', function (t) {
	let file_path = "./tests/files/full_go.go"
	let content = fs.readFileSync(file_path, 'utf8')

	let parsed_full_go = defold_parser.decode_object(content)
	let encoded = defold_parser.encode_object(parsed_full_go)

	t.assert(content == encoded)
	t.end();
});


test('Defold Encode Collection With several embedded component', function (t) {
	let file_path = "./tests/files/collection_several_embedded.collection"
	let content = fs.readFileSync(file_path, 'utf8')

	let parsed_collection = defold_parser.decode_object(content)
	let encoded = defold_parser.encode_object(parsed_collection)

	t.assert(content == encoded)
	t.end();
});


test('Defold Encode GUI', function (t) {
	let file_path = "./tests/files/gui.gui"
	let content = fs.readFileSync(file_path, 'utf8')

	let parsed_gui = defold_parser.decode_object(content)
	let encoded = defold_parser.encode_object(parsed_gui)

	// defold_parser.save_to_file("./test.gui", parsed_gui)

	t.assert(content == encoded)
	t.end();
});
