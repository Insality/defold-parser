const fs = require('fs')

const regex_property_string_value = /^(".*")$/ // "value"
const regex_value_is_string = /^".*"$/
const regex_value_is_number = /^-?[0-9.E-]+$/

const defold_regex = /(?:data:)|(?:^|\s)(\w+):\s+(.+(?:\s+".*)*)|(\w*)\W{|(})/


function unescape_data(value, element_name) {
	value = value.split("\n").map(x => x.trim().slice(1, -1)).join("\n")
	value = value.replace(/\\"/g, '"')
	value = value.replace(/\\n/g, "")
	value = value.replace(/\\/g, "")

	// Find included data HACK
	value = value.split("\n")
	let is_data = false
	for (let i in value) {
		let line = value[i].trim()
		if (line.startsWith("data:") && !is_data) {
			let is_object_data = (line.slice(5).indexOf(":") >= 0 || line.slice(5).indexOf("{") >= 0)
			if (is_object_data) {
				is_data = true
				value[i] = value[i] + '"'
			}
		} else if ((line == '"' || line == '""') && is_data) {
			is_data = false
			value[i] = value[i] + '"'
		} else {
			if (is_data) {
				value[i] = '"' + value[i] + '"';
			}
		}
	}
	value = value.join("\n")

	return value
}


function is_multiline_value(value) {
	let text_array = value.split("\n")
	return (text_array[0] && text_array[0].endsWith("\\n\""))
}


function decode_value(value, property_name) {
	if (value.match(regex_value_is_string)) {
		value = value.substring(1, value.length-1)
	} else if (value.match(regex_value_is_number)) {
		value = parseFloat(value)
	}

	if (property_name == "text") {
		value = "" + value
	}

	return value
}


function decode_defold_object(text) {
	let defold_object = {}
	let object_stack = [ defold_object ]
	let element_name_stack = [ "root" ]

	let last_match_index = false

	let found = text.match(defold_regex)
	while (found) {
		let name = found[1]
		let value = found[2]
		let element_name = found[3]
		let element_exit = found[4]
		last_match_index = found.index + found[0].length

		if (element_name) {
			let last_object = object_stack[object_stack.length - 1]

			let new_object = {}
			last_object[element_name] = last_object[element_name] || []
			last_object[element_name].push(new_object)

			object_stack.push(new_object)
			element_name_stack.push(element_name)
		} else if (name && value) {
			let element_name = element_name_stack[element_name_stack.length - 1]
			value = decode_value(value, name)

			// Decode multiline text here to
			// TODO: move multiline parsing to general flow
			if (name == "text" && is_multiline_value(value)) {
				value = unescape_data(value, element_name);
			}
			if (name == "data" && element_name !== "embedded_collision_shape") {
				value = unescape_data(value, element_name);
				value = decode_defold_object(value)
			}

			let last_object = object_stack[object_stack.length - 1]
			last_object[name] = last_object[name] || []
			last_object[name].push(value)
		} else if (element_exit) {
			element_name_stack.pop()
			object_stack.pop()
		}

		text = text.substring(last_match_index)
		found = text.match(defold_regex)
	}

	return defold_object
}


const withDotParams = ["x", "y", "z", "w", "alpha", "outline_alpha", "shadow_alpha",
"text_leading", "text_tracking", "pieFillAngle", "innerRadius", "leading", "tracking", "data",
"t_x", "t_y", "spread", "start_delay", "inherit_velocity", "start_delay_spread", "duration_spread",
"start_offset", "outline_width", "shadow_x", "shadow_y", "aspect_ratio", "far_z", "mass",
"linear_damping", "angular_damping", "gain" , "pan", "speed", "duration"]
const notConstants = ["text", "id", "value"]

function encode_defold_object(obj, spaces, data_level) {
	let result = ''
	data_level = data_level || 0
	spaces = spaces || 0
	let tabString = ' '.repeat(spaces)

	let keyType, value
	for (let key in obj) {
		value = obj[key]
		keyType = typeof value

		let arr = obj[key]
		for (let j = 0; j < arr.length; j++) {
			let value = arr[j]
			let value_type = typeof(value)
			if (key == 'data' && value_type == "object") {
				let encodedChild = encode_defold_object(value, null, data_level + 1)

				if (data_level == 0) {
					encodedChild = encodedChild.replace(/"/g, '\\"')
					encodedChild = encodedChild.replace(/\n/g, '\\n"\n' + tabString + '"')
				}
				if (data_level == 1) {
					encodedChild = encodedChild.replace(/\"/g, '\\\\"')
					encodedChild = encodedChild.replace(/\n/g, '\\\n')
				}

				result += tabString + key + ': "' + encodedChild + '"\n'
			} else if (key == "children") {
				if (!value.match(regex_property_string_value)) {
					value = '"' + arr[j] + '"'
				}
				result += tabString + key + ": " + value + "\n"
			} else if (value_type == "number") {
				let withDot = (withDotParams.indexOf(key) >= 0)
				if (String(value).indexOf('.') >= 0) {
					withDot = false
				}
				if (withDot) {
					value = value.toFixed(1)
				}
				value = ("" + value).replace(/e/g, "E")
				result += tabString + key + ': ' + value + '\n'
			} else if (value_type == "string") {
				if (value.match(/^[A-Z_\d]+$/) && notConstants.indexOf(key) < 0) {
					// Defold Constant
					result += tabString + key + ': ' + value + '\n'
				} else if (value === "false" || value === "true") {
					result += tabString + key + ': ' + value + '\n'
				} else {
					// Multiline text
					let text_array = value.split("\n")
					for (let i = 0; i < text_array.length; i++) {
						let v = text_array[i]
						if (i == 0) {
							let postfix = '"\n'
							if (text_array.length > 1) {
								postfix = '\\n"\n'
							}
							result += tabString + key + ': "' + v + postfix
						} else if (i == text_array.length - 1) {
							result += tabString + '"' + v + '"\n'
						} else {
							result += tabString + '"' + v + '\\n"\n'
						}
					}
				}
			} else {
				result += tabString + key + ' {\n'
				result += encode_defold_object(arr[j], spaces + 2, data_level)
				result += tabString + '}\n'
			}
		}
	}

	return result
}


function load_from_file(fileName) {
   let content = fs.readFileSync(fileName, 'utf8')
   return decode_defold_object(content)
}


function save_to_file(fileName, obj) {
   let encodedData = encode_defold_object(obj)
   fs.writeFileSync(fileName, encodedData)
}


module.exports.load_from_file = load_from_file
module.exports.save_to_file = save_to_file
module.exports.decode_object = decode_defold_object
module.exports.encode_object = encode_defold_object
